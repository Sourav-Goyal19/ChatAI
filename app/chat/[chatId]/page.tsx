import React from "react";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { ChatHomePage } from "./chat-home";
import { getVersionGroups } from "@/lib/get-versions";

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

  const versionGroups = await getVersionGroups(chatId);

  // console.log(versionGroups);
  return (
    <div className="h-full">
      <ChatHomePage versionGroups={versionGroups} />
    </div>
  );
};

export default ChatIdLayout;
