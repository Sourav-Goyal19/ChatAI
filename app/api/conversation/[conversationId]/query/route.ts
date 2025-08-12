import { z } from "zod";
import { streamText } from "ai";
import MemoryClient from "mem0ai";
import client from "@/lib/prismadb";
import { google } from "@ai-sdk/google";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
// import { Memory } from "mem0ai/oss";

const querySchema = z.object({
  query: z.string().min(1, "Query is required"),
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

const memories = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY!,
});

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

    const { query } = parsed.data;

    const vg = await client.versionGroup.create({
      data: {
        conversationId: conversationId,
        versions: [],
        messages: {
          create: {
            content: query,
            role: "user",
            sender: user.id,
            conversationId: conversationId,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    const relevantMemories = await memories.search(query, {
      user_id: conversationId,
    });

    const memoriesStr = relevantMemories
      .map((entry) => `-${entry.memory}`)
      .join("\n");

    const versionGroups = await client.versionGroup.findMany({
      where: {
        conversationId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const latestFive = versionGroups.reverse();

    const history = latestFive.flatMap((group) => {
      return group.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    });

    const stream = streamText({
      model: google("gemini-1.5-flash"),
      messages: [
        ...history,
        {
          role: "user",
          content: query,
        },
      ],
      system: `
      You are an intelligent, helpful assistant designed to provide thoughtful, accurate responses using both general knowledge and user-specific context from these memories:
        ${memoriesStr}

       # Core Principles:
        - Be genuinely helpful - Provide actionable, tailored information that addresses the user's real intent
        - Prioritize accuracy - Admit uncertainty, avoid speculation, and flag outdated/dynamic information
        - Adapt dynamically - Match the user's tone (formal/casual), knowledge level, and emotional context
        - Communicate effectively - Balance depth with clarity, using examples when helpful

       # Response Style Guide:
        ✅ Do:
        - Lead with key information (inverted pyramid structure)
        - Vary format: brief answers for simple queries, structured explanations for complex topics
        - Use natural transitions - no robotic connectors ("Furthermore...")
        - Explain jargon, but don't over-simplify unnecessarily
        - Acknowledge memory-based responses when relevant

       # ❌ Avoid:
        - Generic phrases ("Great question!") or rigid templates
        - Unsolicited humor/opinions (match user's tone first)
        - False confidence - use "Based on available information..." for uncertain topics
        - Information overload - chunk complex answers with clear headings

       # Special Protocols:
        🌐 For current events: "My knowledge only extends to [date] - you may want to check newer sources for updates."
        ⚖️ Controversial topics: Present major perspectives neutrally, highlight areas of consensus/disagreement
        💡 Ambiguous queries: Ask clarifying questions rather than guessing ("When you say X, do you mean...?")
        🤔 User expertise detection: Start mid-level, then adjust based on follow-up questions

       # Quality Benchmark:
        Every response should leave the user thinking "This exactly addresses what I needed, in the right way."
      `,
      onFinish: async (finishResponse) => {
        const aiMessage = await client.message.create({
          data: {
            content: finishResponse.text,
            role: "assistant",
            sender: "assistant",
            conversationId: conversationId,
            versionGroupId: vg.id,
          },
        });

        await memories.add(
          [
            { role: "user", content: query },
            { role: "assistant", content: finishResponse.text },
          ],
          { user_id: conversationId }
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
      },
    });

    return stream.toTextStreamResponse();
  } catch (error) {
    console.error("QUERY[POST]:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
