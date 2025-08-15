"use client";

import axios from "axios";
import Link from "next/link";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { ConversationType } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { Plus, Search, MoreHorizontal, Trash2, Edit3 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import { LoadingModal } from "@/components/ui/loading-modal";

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
      chat.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
    console.log(pathname);
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
        prev.filter((chat) => chat.id != conversation.id)
      );
      if (pathname == `/chat/${conversation.id}`) {
        router.push("/chat");
      }
      toast.success(message);
    },
    onError: (err: any) => {
      console.error("Failed to delete conversation", err);
      toast.error(
        err.response.data.error || err.message || "Something bad happened"
      );
    },
  });

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b border-border/40 p-4">
        <Link href="/chat" className="w-full">
          <Button className="w-full justify-start gap-2 h-10" size="default">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 overflow-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        {mutation.isPending ? <LoadingModal /> : null}
        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild className="group">
                    <a
                      href={`/chat/${chat.id}`}
                      className="flex items-center gap-2 p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium">
                          {chat.title || chat.id || "Untitled Chat"}
                        </div>
                      </div>
                    </a>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="opacity-0 group-hover:opacity-100 cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onClick={() => mutation.mutate(chat.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex justify-center">
              <UserButton showName />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
