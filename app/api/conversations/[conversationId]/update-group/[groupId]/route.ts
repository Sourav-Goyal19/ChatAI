import client from "@/lib/prismadb";
import { isValidObjectId } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string; groupId: string }> }
) {
  const { index } = await req.json();
  const { groupId, conversationId } = await params;

  if (!isValidObjectId(groupId) || !isValidObjectId(conversationId)) {
    return NextResponse.json(
      {
        error: "Invalid Id",
      },
      { status: 400 }
    );
  }

  await client.versionGroup.update({
    where: { id: groupId, conversationId },
    data: { index },
  });

  return NextResponse.json({ success: true });
}
