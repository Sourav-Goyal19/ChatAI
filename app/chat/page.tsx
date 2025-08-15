"use client";

import type React from "react";

import { z } from "zod";
import axios from "axios";
import { Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { ConversationType } from "@/types";
import { useRouter } from "next/navigation";
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
      console.log(res);
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-card">
        <div className="max-w-md mx-auto text-center space-y-6 px-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground">
            Welcome to Next Chat
          </h2>
          <p className="text-muted-foreground">
            I'm here to help with anything you need.
            <br />
            Ask a question or share your thoughts below.
          </p>

          <div className="pt-2">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Try asking something
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border p-4 bg-sidebar">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-3xl mx-auto w-full"
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                {...form.register("query")}
                placeholder="Type your message here..."
                className="min-h-[44px] max-h-[120px] resize-none pr-12 bg-background"
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div ref={textareaRef} />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 shrink-0"
              disabled={form.formState.isSubmitting}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
