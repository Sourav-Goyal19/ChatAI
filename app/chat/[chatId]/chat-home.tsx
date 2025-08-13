"use client";

import type React from "react";

import { z } from "zod";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import MDEditor from "@uiw/react-md-editor";
import {
  Send,
  User,
  Bot,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryStore } from "@/zustand/store";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { VersionGroupType, MessageType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [currentVersionIndices, setCurrentVersionIndices] = useState<
    Record<string, number>
  >({});

  const getCurrentMessages = () => {
    const messages: MessageType[] = [];

    versionGroups.forEach((group) => {
      const currentIndex = currentVersionIndices[group.id] || 0;
      const startIndex = currentIndex * 2;
      const endIndex = startIndex + 2;
      const currentMessages = group.messages.slice(startIndex, endIndex);
      messages.push(...currentMessages);
    });

    return messages.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  const refreshVersions = async () => {
    try {
      const response = await fetch(
        `/api/conversations/${params.chatId}/versions`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { versionGroups } = await response.json();

      setVersionGroups(versionGroups);
    } catch (error) {
      console.error("Failed to refresh versions:", error);
      toast.error("Failed to refresh conversation");
    }
  };

  const allMessages = getCurrentMessages();

  const hasMultipleVersions = (groupId: string) => {
    const group = versionGroups.find((g) => g.id === groupId);
    return group && group.messages.length > 2;
  };

  const getVersionInfo = (groupId: string) => {
    const group = versionGroups.find((g) => g.id === groupId);
    if (!group) return { current: 0, total: 0 };

    const totalVersions = Math.ceil(group.messages.length / 2);
    const currentVersion = (currentVersionIndices[groupId] || 0) + 1;

    return { current: currentVersion, total: totalVersions };
  };

  const navigateVersion = (groupId: string, direction: "prev" | "next") => {
    const group = versionGroups.find((g) => g.id === groupId);
    if (!group) return;

    const totalVersions = Math.ceil(group.messages.length / 2);
    const currentIndex = currentVersionIndices[groupId] || 0;

    let newIndex = currentIndex;
    if (direction === "prev" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === "next" && currentIndex < totalVersions - 1) {
      newIndex = currentIndex + 1;
    }

    setCurrentVersionIndices((prev) => ({
      ...prev,
      [groupId]: newIndex,
    }));
  };

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

  const editFormSchema = z.object({
    content: z.string().min(1, "Message cannot be empty"),
  });

  type EditFormType = z.infer<typeof editFormSchema>;

  const editForm = useForm<EditFormType>({
    defaultValues: {
      content: "",
    },
    resolver: zodResolver(editFormSchema),
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

  const handleEditMessage = (message: MessageType) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    editForm.setValue("content", message.content);
  };

  const handleEditSubmit = async (values: EditFormType) => {
    if (!editingMessageId) return;

    const messageToEdit = allMessages.find((m) => m.id === editingMessageId);
    if (!messageToEdit || messageToEdit.role !== "user") return;

    // setIsLoading(true);

    setEditingMessageId(null);
    editForm.reset();

    try {
      const res = await fetch(
        `/api/conversations/${params.chatId}/edit/${editingMessageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ editedQuery: values.content }),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      const groupId = messageToEdit.versionGroupId;
      const group = versionGroups.find((g) => g.id === groupId);
      if (!group) return;

      const newUserMessage: MessageType = {
        id: `editing-user-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: params.chatId as string,
        versionGroupId: groupId,
        sender: "user",
        content: values.content,
        role: "user",
        files: [],
        streaming: false,
      };

      const newAIMessage: MessageType = {
        id: `editing-ai-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: params.chatId as string,
        versionGroupId: groupId,
        sender: "assistant",
        content: "",
        role: "assistant",
        files: [],
        streaming: true,
      };

      const newVersionIndex = Math.ceil((group.messages.length + 2) / 2) - 1;

      setCurrentVersionIndices((prev) => ({
        ...prev,
        [groupId]: newVersionIndex,
      }));

      setVersionGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                messages: [...g.messages, newUserMessage, newAIMessage],
              }
            : g
        )
      );

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        setVersionGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  messages: g.messages.map((msg) =>
                    msg.id === newAIMessage.id
                      ? { ...msg, content: fullText, streaming: false }
                      : msg
                  ),
                }
              : g
          )
        );
      }

      toast.success("Message edited successfully!");
      await refreshVersions();
    } catch (error: any) {
      console.error("Edit error:", error);
      toast.error(
        error.response?.data?.error || error.message || "Failed to edit message"
      );

      setEditingMessageId(editingMessageId);
      editForm.setValue("content", values.content);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: FormType) => {
    if (!values.query.trim()) return;
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

      const res = await fetch(`/api/conversations/${params.chatId}/query`, {
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
      await refreshVersions();
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
            allMessages.map((message) => {
              const versionInfo = getVersionInfo(message.versionGroupId);
              const showVersionControls =
                hasMultipleVersions(message.versionGroupId) &&
                message.role === "user";

              return (
                <div key={message.id}>
                  <div
                    className={`flex gap-4 group relative ${
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

                    <div className="relative max-w-[80%]">
                      <Card
                        className={`p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-card-foreground border-border"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <MDEditor.Markdown
                            source={message.content}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-background border border-border shadow-sm hover:bg-accent"
                          onClick={() => handleEditMessage(message)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {showVersionControls && (
                    <div className="flex items-center justify-end gap-2 mt-2 mr-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          navigateVersion(message.versionGroupId, "prev")
                        }
                        disabled={versionInfo.current === 1}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        {versionInfo.current} / {versionInfo.total}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          navigateVersion(message.versionGroupId, "next")
                        }
                        disabled={versionInfo.current === versionInfo.total}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
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

      <Dialog
        open={editingMessageId !== null}
        onOpenChange={() => setEditingMessageId(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(handleEditSubmit)}
            className="space-y-4"
          >
            <Textarea
              {...editForm.register("content")}
              placeholder="Edit your message..."
              className="min-h-[100px] resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingMessageId(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
