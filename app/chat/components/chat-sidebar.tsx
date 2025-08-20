"use client";

import axios from "axios";
import Link from "next/link";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { UserButton } from "@clerk/nextjs";
import { ConversationType } from "@/types";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { Search, Trash2, MessageSquare, MoreHorizontal, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingModal } from "@/components/ui/loading-modal";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

interface ChatSidebarProps {
  conversations: ConversationType[];
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ conversations }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [filteredChats, setFilteredChats] =
    useState<ConversationType[]>(conversations);
  const [searchQuery, setSearchQuery] = useState("");

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
    <Sidebar className="bg-[#181818] border-r border-zinc-800 group/sidebar">
      {mutation.isPending && <LoadingModal />}

      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 space-y-3 border-b border-zinc-800">
          <Link href="/chat" className="block">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                "text-zinc-300 hover:text-white hover:bg-[#303030]",
                "group/new-chat"
              )}
            >
              <MessageSquare className="h-4 w-4 transition-transform group-hover/new-chat:scale-110" />
              <span className="text-sm font-medium">New chat</span>
            </div>
          </Link>

          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              "bg-[#202020] border border-zinc-700 text-zinc-300",
              "focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500"
            )}
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "border-0 bg-transparent p-0 h-auto font-medium",
                  "placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                )}
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-4 w-4 text-zinc-400 hover:text-zinc-200",
                  "hover:bg-transparent"
                )}
                onClick={() => setSearchQuery("")}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden ">
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2 mt-1 px-4">
            Recent Chats
          </h2>

          <div className="px-3 pb-4 overflow-y-auto h-full">
            <div className="space-y-1">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-zinc-500 text-sm mb-2">
                    {searchQuery
                      ? "No matching chats found"
                      : "No conversations yet"}
                  </div>
                  <div className="text-zinc-600 text-xs">
                    {searchQuery
                      ? "Try a different search term"
                      : "Start a new chat to begin"}
                  </div>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isActive = pathname === `/chat/${chat.id}`;
                  return (
                    <div key={chat.id} className="group relative">
                      <Link href={`/chat/${chat.id}`}>
                        <div
                          className={cn(
                            "flex items-center justify-between px-3 py-1.5 rounded-lg transition-all cursor-pointer text-white",
                            isActive ? "bg-[#303030]" : "hover:bg-[#303030]"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium mb-0.5">
                              {chat.title ||
                                "New Chat" ||
                                `Chat ${chat.id.slice(0, 8)}`}
                            </div>
                            {chat.model && (
                              <div className="text-xs text-zinc-500 truncate">
                                {chat.model}
                              </div>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 opacity-0 group-hover:opacity-100",
                                  "hover:bg-zinc-600 rounded transition-all",
                                  isActive && "opacity-100"
                                )}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              className="w-48 bg-[#202020] border-zinc-700"
                            >
                              <DropdownMenuItem
                                className={cn(
                                  "text-red-400 hover:text-red-300 cursor-pointer",
                                  "hover:bg-red-900/20 focus:bg-red-900/20 focus:text-red-300"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  mutation.mutate(chat.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete conversation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-center p-2 rounded-lg",
            "bg-[#181818] border-t border-zinc-700 transition-colors"
          )}
        >
          <UserButton
            showName
            appearance={{
              elements: {
                rootBox: "flex items-center w-full",
                userButtonBox: "flex items-center gap-2 w-full",
                userButtonOuterIdentifier: "text-sm text-zinc-300",
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
