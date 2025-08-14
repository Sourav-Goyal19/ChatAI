import client from "@/lib/prismadb";
import { isValidObjectId } from "mongoose";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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
    const { conversationId } = await params;
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorize",
        },
        {
          status: 401,
        }
      );
    }

    if (!isValidObjectId(conversationId)) {
      return NextResponse.json(
        {
          error: "Invalid Conversation Id",
        },
        {
          status: 400,
        }
      );
    }

    const deletedConversation = await client.conversation.delete({
      where: {
        id: conversationId,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        message: "Conversation Deleted Successfully",
        conversation: deletedConversation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CONVERSATION[DELETE]:", error);
    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
