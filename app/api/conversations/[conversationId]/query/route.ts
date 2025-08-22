import { z } from "zod";
import { streamText, generateText } from "ai";
// import { queryChain } from "@/lib/chains";
// import { HumanMessage } from "@langchain/core/messages";
import client from "@/lib/prismadb";
import { memories } from "@/lib/mem0";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const querySchema = z.object({
  query: z.string().min(1, "Query is required"),
  isFirstQuery: z.boolean().default(false),
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// const memory = new Memory({
//   version: "v1.1",
//   llm: {
//     provider: "gemini",
//     config: {
//       apiKey: process.env.GOOGLE_API_KEY,
//       model: "gemini-1.5-flash",
//     },
//   },
//   embedder: {
//     provider: "gemini",
//     config: {
//       apiKey: process.env.GOOGLE_API_KEY,
//       model: "models/text-embedding-004",
//     },
//   },
//   vectorStore: {
//     provider: "qdrant",
//     config: {
//       collectionName: "chatgpt-clone",
//       dimension: 768,
//       url: "https://139b6306-b511-4939-b964-723dfe27b73c.eu-west-2-0.aws.cloud.qdrant.io",
//       apiKey: process.env.QDRANT_CHATGPT_API_KEY,
//       embeddingModelDims: 768,
//     },
//   },
// });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const body = await req.json();
    const { conversationId } = await params;
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    const parsed = querySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 }
      );
    }

    const { query, isFirstQuery } = parsed.data;

    // const aires = await queryChain.invoke({
    //   history: [new HumanMessage(query)],
    // });

    const vg = await client.versionGroup.create({
      data: {
        conversation: { connect: { id: conversationId } },
        messages: {
          create: {
            content: query,
            role: "user",
            sender: user.id,
            conversation: { connect: { id: conversationId } },
          },
        },
      },
      include: { messages: true },
    });

    // fetching memories and history in parallel
    const [relevantMemories, versionGroups] = await Promise.all([
      memories.search(query, { user_id: user.id }),
      client.versionGroup.findMany({
        where: { conversationId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const memoriesStr = relevantMemories
      .map((entry) => `- ${entry.memory}`)
      .join("\n");

    console.log("Memories:", memoriesStr);

    const history = versionGroups
      .reverse()
      .flatMap((group) => {
        const adjustedIndex =
          group.index % 2 === 0 ? group.index : group.index - 1;
        return group.messages.slice(adjustedIndex, adjustedIndex + 2);
      })
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    const stream = streamText({
      // model: google("gemini-2.0-flash"),
      model: groq("moonshotai/kimi-k2-instruct"),
      // model: openrouter("meta-llama/llama-3.3-70b-instruct"),
      messages: [...history, { role: "user", content: query }],
      system: SYSTEM_PROMPT.replace("{memories}", memoriesStr),
      onFinish: async (finishResponse) => {
        try {
          if (isFirstQuery) {
            generateConversationName(
              query,
              finishResponse.text,
              conversationId
            );
          }

          const aiMessage = await client.message.create({
            data: {
              content: finishResponse.text,
              role: "assistant",
              sender: "assistant",
              conversation: { connect: { id: conversationId } },
              versionGroup: { connect: { id: vg.id } },
            },
          });

          await memories.add(
            [
              { role: "user", content: query },
              { role: "assistant", content: finishResponse.text },
            ],
            { user_id: user.id }
          );

          await client.versionGroup.update({
            where: { id: vg.id },
            data: {
              versions: {
                push: [vg.messages[0].id, aiMessage.id],
              },
            },
          });

          await client.conversation.update({
            where: { id: conversationId },
            data: { lastActivityAt: new Date() },
          });
        } catch (error) {
          console.error("onFinish error:", error);
        }
      },
    });

    return stream.toTextStreamResponse();
  } catch (error) {
    console.error("QUERY[POST]:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}

async function generateConversationName(
  user: string,
  ai: string,
  conversationId: string
) {
  const res = await generateText({
    model: google("gemini-1.5-flash"),
    messages: [
      {
        role: "user",
        content: user,
      },
      {
        role: "assistant",
        content: ai,
      },
      {
        role: "user",
        content:
          "Generate a short and meaningful title (under 5 words) for this conversation based on the user's query and the assistant's response. The title should be relevant, clear, and reflect the core topic discussed.",
      },
    ],
  });

  await client.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      title: res.text.trim(),
    },
  });
}
