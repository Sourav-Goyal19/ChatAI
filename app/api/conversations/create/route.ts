import client from "@/lib/prismadb";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    const conversation = await client.conversation.create({
      data: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      message: "Conversation created successfully.",
      conversation,
    });
  } catch (error) {
    console.error("CONVERSATION[POST/CREATE]:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
