import path from "path";
import { Readable } from "stream";
import client from "@/lib/prismadb";
import { memories } from "@/lib/mem0";
import { google } from "@ai-sdk/google";
import sanitize from "sanitize-filename";
import cloudinary from "@/lib/cloudinary";
import { createGroq } from "@ai-sdk/groq";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { streamText, type FilePart } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { currentUser } from "@clerk/nextjs/server";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      conversationId: string;
    }>;
  }
) {
  try {
    const formdata = await req.formData();
    const { conversationId } = await params;
    const query = formdata.get("query")?.toString();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (!query) {
      return NextResponse.json({ error: "Query is missing" }, { status: 400 });
    }

    const files: File[] = [];
    formdata.forEach((value) => {
      if (value instanceof File) {
        files.push(value);
      }
    });

    const [versionGroups, relevantMemories, vg] = await Promise.all([
      client.versionGroup.findMany({
        where: { conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      memories.search(query, {
        user_id: conversationId,
      }),
      client.versionGroup.create({
        data: {
          conversationId: conversationId,
          index: 0,
          versions: [],
        },
      }),
    ]);

    const history = versionGroups
      .reverse()
      .flatMap((group) => {
        const startIndex = group.index;
        return group.messages.slice(startIndex, startIndex + 2);
      })
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    const memoriesStr = relevantMemories
      .map((entry) => entry.memory)
      .join("\n");

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
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

    const filesData: FilePart[] = await Promise.all(
      uploadedFiles.map(async (file) => {
        const res = await fetch(file.url);
        const data = await res.arrayBuffer();
        return {
          type: "file",
          data: Buffer.from(data),
          mediaType: file.type,
        };
      })
    );

    const stream = streamText({
      model: google("gemini-2.5-flash"),
      // model: groq("moonshotai/kimi-k2-instruct"),
      // model: openrouter("deepseek/deepseek-chat-v3-0324:free"),
      messages: [
        ...history,
        {
          role: "user",
          content: [{ type: "text", text: query }, ...filesData],
        },
      ],
      system: SYSTEM_PROMPT.replace("{memories}", memoriesStr),
      onFinish: async (finishResponse) => {
        const userMsg = await client.message.create({
          data: {
            content: query,
            role: "user",
            sender: "user",
            conversationId: conversationId,
            versionGroupId: vg.id,
          },
        });
        const [aiMsg, files] = await Promise.all([
          client.message.create({
            data: {
              content: finishResponse.text,
              role: "assistant",
              sender: "assistant",
              conversationId: conversationId,
              versionGroupId: vg.id,
            },
          }),
          client.file.createMany({
            data: uploadedFiles.map((file) => ({
              fileName: file.originalName,
              fileType: file.type,
              storageUrl: file.url,
              conversationId: conversationId,
              userId: user.id,
            })),
          }),
        ]);

        await client.versionGroup.update({
          where: {
            id: vg.id,
          },
          data: {
            versions: {
              push: [userMsg.id, aiMsg.id],
            },
          },
        });
      },
    });

    return stream.toTextStreamResponse();
  } catch (error) {
    console.error("Upload & stream error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
