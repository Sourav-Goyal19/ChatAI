"use client";
import { Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
        <h1 className="text-lg font-semibold">ChatGPT</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2 bg-transparent"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </header>
  );
}
