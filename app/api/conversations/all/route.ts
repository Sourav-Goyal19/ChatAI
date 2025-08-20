import client from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          success: false,
        },
        {
          status: 401,
        }
      );
    }

    const conversations = await client.conversation.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        message: "Conversations found successfully",
        success: true,
        conversations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CONVERSATIONS[GET]:", error);
    return NextResponse.json(
      {
        error: "Something went wrong",
        success: false,
      },
      { status: 500 }
    );
  }
}
