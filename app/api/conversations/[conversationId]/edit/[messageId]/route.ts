import { z } from "zod";
import path from "path";
import { Readable } from "stream";
import client from "@/lib/prismadb";
import { memories } from "@/lib/mem0";
import { google } from "@ai-sdk/google";
import sanitize from "sanitize-filename";
import cloudinary from "@/lib/cloudinary";
import { createGroq } from "@ai-sdk/groq";
import { isValidObjectId } from "mongoose";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { streamText, type FilePart } from "ai";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const editQuerySchema = z.object({
  editedQuery: z.string().min(0, ""),
  existingFileIds: z.string().optional(),
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
    const user = await currentUser();
    const formdata = await req.formData();
    const { conversationId, messageId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    if (!isValidObjectId(conversationId) || !isValidObjectId(messageId)) {
      return NextResponse.json(
        {
          error: "Invalid Id",
        },
        { status: 400 }
      );
    }

    const editedQuery = formdata.get("editedQuery")?.toString() || "";
    const existingFileIdsStr = formdata.get("existingFileIds")?.toString();

    let existingFileIds: string[] = [];
    if (existingFileIdsStr) {
      try {
        existingFileIds = JSON.parse(existingFileIdsStr);
      } catch (error) {
        console.error("Error parsing existingFileIds:", error);
      }
    }

    const newFiles: File[] = [];
    formdata.forEach((value, key) => {
      if (value instanceof File && key.startsWith("newFiles[")) {
        newFiles.push(value);
      }
    });

    if (
      !editedQuery.trim() &&
      existingFileIds.length === 0 &&
      newFiles.length === 0
    ) {
      return NextResponse.json(
        { error: "Either content or files must be provided" },
        { status: 400 }
      );
    }

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

    const uploadedFiles = await Promise.all(
      newFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = sanitize(path.parse(file.name).name);

        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              public_id: safeName,
              folder: "chatgpt-clone",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          const readable = new Readable();
          readable.push(buffer);
          readable.push(null);
          readable.pipe(uploadStream);
        });

        const result: any = await uploadPromise;
        return {
          url: result.secure_url as string,
          type: file.type,
          originalName: file.name,
        };
      })
    );

    const existingFiles =
      existingFileIds.length > 0
        ? await client.file.findMany({
            where: {
              id: { in: existingFileIds },
            },
          })
        : [];

    const allFiles = [
      ...existingFiles,
      ...uploadedFiles.map((f) => ({
        storageUrl: f.url,
        fileType: f.type,
        fileName: f.originalName,
      })),
    ];

    const filesData: FilePart[] =
      allFiles.length > 0
        ? (
            await Promise.all(
              allFiles.map(async (file) => {
                try {
                  const res = await fetch(file.storageUrl);
                  const data = await res.arrayBuffer();
                  return {
                    type: "file" as const,
                    data: Buffer.from(data),
                    mediaType: file.fileType,
                  } as FilePart;
                } catch (error) {
                  console.error(`Error fetching file ${file.fileName}:`, error);
                  return null;
                }
              })
            )
          ).filter((file): file is FilePart => file !== null)
        : [];

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
        user_id: user.id,
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

    const messageContent =
      filesData.length > 0
        ? [{ type: "text" as const, text: editedQuery }, ...filesData]
        : editedQuery;

    const text = streamText({
      // model: google("gemini-2.5-flash"),
      // model: groq("moonshotai/kimi-k2-instruct"),
      model: openrouter("openai/gpt-4o"),
      messages: [
        ...history,
        {
          role: "user",
          content: messageContent,
        },
      ],
      system: SYSTEM_PROMPT.replace("{memories}", memoriesStr),
      onFinish: async (finishResponse) => {
        const editMessage = await client.message.create({
          data: {
            role: "user",
            sender: "user",
            content: editedQuery,
            conversationId: conversationId,
            versionGroupId: editedVersionGroup?.id,
          },
        });

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

        await Promise.all(
          uploadedFiles.map((file) =>
            client.file.create({
              data: {
                fileName: file.originalName,
                fileType: file.type,
                storageUrl: file.url,
                conversationId: conversationId,
                userId: user.id,
                messageId: editMessage.id,
              },
            })
          )
        );

        await Promise.all(
          existingFiles.map((file) =>
            client.file.create({
              data: {
                fileName: file.fileName,
                fileType: file.fileType,
                storageUrl: file.storageUrl,
                conversationId: conversationId,
                userId: user.id,
                messageId: editMessage.id,
              },
            })
          )
        );

        const [previousEditedMemory] = await memories.getAll({
          filters: {
            AND: [
              { user_id: user.id },
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
              { user_id: user.id }
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
