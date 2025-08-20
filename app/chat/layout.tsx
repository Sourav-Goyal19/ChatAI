"use client";

import axios from "axios";
import type React from "react";
import { ConversationType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { ChatHeader } from "./components/chat-header";
import { ChatSidebar } from "./components/chat-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: conversations } = useQuery<ConversationType[]>({
    queryKey: ["conversations-all"],
    queryFn: async () => {
      const res = await axios.get("/api/conversations/all");
      return res.data.conversations;
    },
  });
  // console.log(conversations);
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <ChatSidebar conversations={conversations || []} />
        <div className="flex flex-1 flex-col">
          <ChatHeader />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ChatLayout;
