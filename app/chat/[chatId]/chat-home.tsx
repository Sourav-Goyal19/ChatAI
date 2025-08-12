"use client";

import type React from "react";

import { z } from "zod";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import MDEditor from "@uiw/react-md-editor";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { Send, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryStore } from "@/zustand/store";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { VersionGroupType, MessageType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ChatHomePageProps {
  versionGroups: VersionGroupType[];
}

export const ChatHomePage: React.FC<ChatHomePageProps> = ({
  versionGroups: initialVersionGroups,
}) => {
  const params = useParams();
  const { query: firstQuery, clearQuery } = useQueryStore();
  const textareaRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [versionGroups, setVersionGroups] =
    useState<VersionGroupType[]>(initialVersionGroups);

  const allMessages = versionGroups.flatMap((group) => group.messages);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [form.watch("query")]);

  const onSubmit = async (values: FormType) => {
    if (!values.query.trim()) return;
    // setIsLoading(true);
    form.reset();

    try {
      const tempVersionGroup: VersionGroupType = {
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        conversationId: params.chatId as string,
        versions: [],
        messages: [
          {
            id: `temp-user-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            conversationId: params.chatId as string,
            versionGroupId: `temp-${Date.now()}`,
            sender: "user",
            content: values.query,
            role: "user",
            files: [],
            streaming: false,
          },
        ],
      };

      setVersionGroups((prev) => [...prev, tempVersionGroup]);

      const res = await fetch(`/api/conversation/${params.chatId}/query`, {
        method: "POST",
        body: JSON.stringify({ query: values.query }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      form.reset();

      const tempAIMessage: MessageType = {
        id: `temp-ai-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: params.chatId as string,
        versionGroupId: tempVersionGroup.id,
        sender: "assistant",
        content: "",
        role: "assistant",
        files: [],
        streaming: true,
      };

      setVersionGroups((prev) =>
        prev.map((group) =>
          group.id === tempVersionGroup.id
            ? { ...group, messages: [...group.messages, tempAIMessage] }
            : group
        )
      );

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        setVersionGroups((prev) =>
          prev.map((group) =>
            group.id === tempVersionGroup.id
              ? {
                  ...group,
                  messages: group.messages.map((msg) =>
                    msg.id === tempAIMessage.id
                      ? { ...msg, content: fullText, streaming: false }
                      : msg
                  ),
                }
              : group
          )
        );
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred");
      form.setValue("query", values.query);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (firstQuery) {
      form.setValue("query", firstQuery);
      form.handleSubmit(onSubmit)();
      clearQuery();
    }
  }, [firstQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {allMessages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium text-foreground mb-2">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground">
                Start a conversation by typing a message below.
              </p>
            </div>
          ) : (
            allMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-card-foreground border-border"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <MDEditor.Markdown
                      source={message.content}
                      className="text-foreground"
                      style={{
                        background: "transparent",
                        fontSize: "0.875rem",
                        lineHeight: "1.625rem",
                        whiteSpace: "pre-wrap",
                        color: "var(--foreground)",
                      }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </Card>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="max-w-[80%] p-4 bg-card text-card-foreground border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    AI is thinking...
                  </span>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card p-4">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-3xl mx-auto"
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Textarea
                {...form.register("query")}
                placeholder="Type your message here..."
                className="min-h-[44px] max-h-[120px] resize-none"
                onKeyDown={handleKeyDown}
                id="querybox"
                rows={1}
                disabled={isLoading}
              />
              <div ref={textareaRef} />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !form.watch("query")?.trim()}
              className="h-11 w-11 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
