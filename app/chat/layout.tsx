import type React from "react";
import { ChatHeader } from "./components/chat-header";
import { ChatSidebar } from "./components/chat-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import client from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const ChatLayout = async ({ children }: { children: React.ReactNode }) => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const conversations = await client.conversation.findMany({
    where: {
      userId,
    },
  });
  // console.log(conversations);
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <ChatSidebar conversations={conversations} />
        <div className="flex flex-1 flex-col">
          <ChatHeader />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ChatLayout;
