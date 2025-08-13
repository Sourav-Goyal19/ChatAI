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
      <div className="flex-1 overflow-y-auto p-4"></div>

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
