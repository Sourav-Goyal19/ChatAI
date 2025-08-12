import React from "react";
import mongoose from "mongoose";
import client from "@/lib/prismadb";
import { redirect } from "next/navigation";
import { ChatHomePage } from "./chat-home";

interface ChatIdLayoutProps {
  params: Promise<{
    chatId: string;
  }>;
}

const ChatIdLayout: React.FC<ChatIdLayoutProps> = async ({ params }) => {
  const { chatId } = await params;
  if (!mongoose.isValidObjectId(chatId)) {
    redirect("/chat");
  }

  const versionGroups = await client.versionGroup.findMany({
    where: {
      conversationId: chatId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // console.log(versionGroups);
  return (
    <div className="h-full">
      <ChatHomePage versionGroups={versionGroups} />
    </div>
  );
};

export default ChatIdLayout;
