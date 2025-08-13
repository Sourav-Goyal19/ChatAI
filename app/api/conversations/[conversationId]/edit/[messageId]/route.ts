import { z } from "zod";
import { streamText } from "ai";
import client from "@/lib/prismadb";
import { memories } from "@/lib/mem0";
import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { isValidObjectId } from "mongoose";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const editQuerySchema = z.object({
  editedQuery: z.string().min(1, "Edited query is required"),
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      conversationId: string;
      messageId: string;
    }>;
  }
) {
  try {
    const body = await req.json();
    const { conversationId, messageId } = await params;
    // console.log(messageId);
    if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
      return NextResponse.json(
        {
          error: "Invalid Id",
        },
        { status: 400 }
      );
    }

    const { error, data } = editQuerySchema.safeParse(body);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    const { editedQuery } = data;

    const editedVersionGroup = await client.versionGroup.findFirst({
      where: {
        versions: {
          has: messageId,
        },
        conversationId: conversationId,
      },
    });

    if (!editedVersionGroup) {
      return NextResponse.json(
        {
          error: "No original message found",
        },
        {
          status: 400,
        }
      );
    }

    const editMessage = await client.message.create({
      data: {
        role: "user",
        sender: "user",
        content: editedQuery,
        conversationId: conversationId,
        versionGroupId: editedVersionGroup?.id,
      },
    });

    const [versionGroups, relevantMemories] = await Promise.all([
      client.versionGroup.findMany({
        where: {
          conversationId: conversationId,
          createdAt: {
            lt: editedVersionGroup.createdAt,
          },
        },
        include: {
          messages: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      memories.search(editedQuery, {
        user_id: conversationId,
      }),
    ]);

    const history = versionGroups
      .reverse()
      .flatMap((group) => {
        const startIdx = group.index % 2 === 0 ? group.index : group.index - 1;
        return group.messages.slice(startIdx, startIdx + 2);
      })
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    const memoriesUpToDate = relevantMemories.filter(
      (memory) =>
        memory.created_at &&
        new Date(memory.created_at) < editedVersionGroup.createdAt
    );

    const memoriesStr = memoriesUpToDate
      .map((entry) => entry.memory)
      .join("\n");

    const text = streamText({
      // model: google("gemini-1.5-flash"),
      model: groq("moonshotai/kimi-k2-instruct"),
      // model: openrouter("deepseek/deepseek-chat-v3-0324:free"),
      messages: [
        ...history,
        {
          role: "user",
          content: editedQuery,
        },
      ],
      system: SYSTEM_PROMPT.replace("{memories}", memoriesStr),
      onFinish: async (finishResponse) => {
        const aiMessage = await client.message.create({
          data: {
            role: "assistant",
            sender: "assistant",
            content: finishResponse.text,
            conversationId: conversationId,
            versionGroupId: editedVersionGroup?.id,
          },
        });
        await client.versionGroup.update({
          where: { id: editedVersionGroup.id },
          data: {
            versions: { push: [editMessage.id, aiMessage.id] },
            index: editedVersionGroup.versions.length,
          },
        });

        const [previousEditedMemory] = await memories.getAll({
          filters: {
            AND: [
              { user_id: conversationId },
              {
                created_at: {
                  gte: editedVersionGroup.createdAt,
                  lte: new Date(
                    editedVersionGroup.createdAt.getTime() + 30 * 1000
                  ),
                },
              },
            ],
          },
          api_version: "v2",
        });

        previousEditedMemory && previousEditedMemory.id
          ? await memories.update(previousEditedMemory.id, finishResponse.text)
          : await memories.add(
              [
                { role: "user", content: editedQuery },
                { role: "assistant", content: finishResponse.text },
              ],
              { user_id: conversationId }
            );
      },
    });

    return text.toTextStreamResponse();
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
