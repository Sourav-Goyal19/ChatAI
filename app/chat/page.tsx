"use client";

import type React from "react";

import { z } from "zod";
import axios from "axios";
import { useRef } from "react";
import { Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { ConversationType } from "@/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryStore } from "@/zustand/store";

export default function ChatHomePage() {
  const router = useRouter();
  const { setQuery } = useQueryStore();
  const textareaRef = useRef<HTMLDivElement>(null);

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
      const res = await axios.post("/api/conversation/create", {});
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

      <div className="sticky bottom-0 bg-card border-t border-border p-4">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-3xl mx-auto w-full"
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Textarea
                {...form.register("query")}
                placeholder="Type your message here..."
                className="min-h-[44px] max-h-[120px] resize-none pr-12"
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
