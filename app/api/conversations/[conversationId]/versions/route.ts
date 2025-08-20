import client from "@/lib/prismadb";
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    if (!isValidObjectId(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }
    const versionGroups = await client.versionGroup.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            files: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // console.log(versionGroups);
    return NextResponse.json({ versionGroups });
  } catch (error) {
    console.error("Error fetching version groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
