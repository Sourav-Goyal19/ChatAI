"use client";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border/40 px-4 py-3 backdrop-blur bg-sidebar">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
        <h1 className="text-lg font-semibold">ChatGPT</h1>
      </div>

      <div className="flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  );
}
