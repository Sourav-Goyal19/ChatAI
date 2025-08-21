"use client";

import type React from "react";

import { z } from "zod";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { ConversationType } from "@/types";
import { useRouter } from "next/navigation";
import { ArrowUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryStore } from "@/zustand/store";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";

export default function ChatHomePage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { setQuery } = useQueryStore();
  const textareaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saveUser = async () => {
      await axios.post("/api/users/save-user", {});
    };
    isSignedIn && saveUser();
  }, [isSignedIn]);

  const formSchema = z.object({
    query: z.string().min(1, "Empty query is not allowed"),
  });

  type FormType = z.infer<typeof formSchema>;

  const form = useForm<FormType>({
    defaultValues: {
      query: "",
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormType) => {
    if (!values.query.trim()) return;
    try {
      const res = await axios.post("/api/conversations/create", {});
      const conversation = res.data.conversation as ConversationType;
      setQuery(values.query);
      router.push(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response.data.error || "Something went wrong");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#212121]">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                How can I help you today?
              </h1>
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto">
            <div className="flex gap-3 items-end bg-[#303030] rounded-3xl p-4 shadow-lg border border-gray-600/20">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 hover:bg-[#212121] transition-colors rounded-xl"
                type="button"
              >
                <Plus className="h-5 w-5 text-white" />
              </Button>

              <div className="flex-1 min-h-[40px] max-h-[120px] flex items-center">
                <Textarea
                  {...form.register("query")}
                  placeholder="Ask anything"
                  className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent placeholder:text-gray-400 text-white focus:outline-none focus:ring-0 px-0 py-2"
                  onKeyDown={handleKeyDown}
                  id="querybox"
                  rows={1}
                />
              </div>

              <Button
                onClick={form.handleSubmit(onSubmit)}
                type="submit"
                size="icon"
                className="h-10 w-10 shrink-0 bg-white hover:bg-gray-200 rounded-xl transition-colors"
                disabled={!form.watch("query")?.trim()}
              >
                <ArrowUp className="h-5 w-5 text-black" />
              </Button>
            </div>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-400">
                ChatGPT can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
