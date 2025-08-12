import { z } from "zod";
// import { queryChain } from "@/lib/chains";
// import { HumanMessage } from "@langchain/core/messages";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import client from "@/lib/prismadb";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

const querySchema = z.object({
  query: z.string().min(1, "Query is required"),
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

    // const aires = await queryChain.invoke({
    //   history: [new HumanMessage(query)],
    // });

    const stream = streamText({
      model: google("gemini-2.0-flash"),
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      onFinish: async (finishResponse) => {
        const vg = await client.versionGroup.create({
          data: {
            conversationId: conversationId,
            versions: [],
          },
        });

        const userMsg = await client.message.create({
          data: {
            content: query,
            role: "user",
            sender: "user",
            conversationId: conversationId,
            versionGroupId: vg.id,
          },
        });

        const aiMsg = await client.message.create({
          data: {
            content: finishResponse.text,
            role: "assistant",
            sender: "assistant",
            conversationId: conversationId,
            versionGroupId: vg.id,
          },
        });

        await client.versionGroup.update({
          data: {
            versions: {
              push: [userMsg.id, aiMsg.id],
            },
          },
          where: {
            id: vg.id,
          },
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
