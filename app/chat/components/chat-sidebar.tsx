"use client";

import axios from "axios";
import Link from "next/link";
import toast from "react-hot-toast";
import { UserButton } from "@clerk/nextjs";
import { ConversationType } from "@/types";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { Search, MoreHorizontal, Trash2, MessageSquare } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LoadingModal } from "@/components/ui/loading-modal";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

interface ChatSidebarProps {
  conversations: ConversationType[];
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ conversations }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] =
    useState<ConversationType[]>(conversations);

  useEffect(() => {
    const filtered = conversations.filter((chat) =>
      (chat.title || chat.id).toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchQuery, conversations]);

  const mutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await axios.delete(
        `/api/conversations/${conversationId}/delete`
      );
      return res.data;
    },
    onSuccess: ({
      message,
      conversation,
    }: {
      message: string;
      conversation: ConversationType;
    }) => {
      setFilteredChats((prev) =>
        prev.filter((chat) => chat.id !== conversation.id)
      );
      if (pathname === `/chat/${conversation.id}`) {
        router.push("/chat");
      }
      toast.success(message);
    },
    onError: (err: any) => {
      console.error("Failed to delete conversation", err);
      toast.error(
        err.response?.data?.error || err.message || "Something bad happened"
      );
    },
  });

  return (
    <Sidebar className="bg-[#181818] border-r border-zinc-800">
      {mutation.isPending && <LoadingModal />}

      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 space-y-3">
          <Link href="/chat" className="block">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#303030] transition-colors cursor-pointer text-zinc-300 hover:text-white">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">New chat</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#303030] transition-colors text-zinc-300">
            <Search className="h-4 w-4" />
            <div className="flex-1">
              <Input
                placeholder="Search chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium placeholder:text-zinc-100 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 px-4">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Chats
            </h2>
          </div>

          <div className="space-y-1">
            {filteredChats.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                {searchQuery ? "No chats found" : "No recent chats"}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <div key={chat.id} className="group relative">
                  <Link href={`/chat/${chat.id}`}>
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer hover:bg-[#303030] ${
                        pathname === `/chat/${chat.id}`
                          ? "bg-[#303030] text-white"
                          : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm">
                          {chat.title || `Chat ${chat.id.slice(0, 8)}`}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all">
                            <MoreHorizontal className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          className="w-40"
                        >
                          <DropdownMenuItem
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              mutation.mutate(chat.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex justify-center">
            <UserButton showName />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
