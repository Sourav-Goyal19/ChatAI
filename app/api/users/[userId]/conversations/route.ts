import client from "@/lib/prismadb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      userId: string;
    }>;
  }
) {
  try {
    const { userId } = await params;

    const conversations = await client.conversation.findMany({
      where: {
        userId,
      },
    });
    return NextResponse.json(
      {
        message: "Conversations found successfully",
        conversations,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("CONVERSATIONS[GET]");
    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      { status: 500 }
    );
  }
}
