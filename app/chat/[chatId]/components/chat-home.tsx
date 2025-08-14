"use client";

import { z } from "zod";
import { Bot } from "lucide-react";
import { toast } from "react-hot-toast";
import { ChatInput } from "./chat-input";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { MessageList } from "./message-list";
import { useQueryStore } from "@/zustand/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditMessageDialog } from "./edit-message-dialog";
import React, { useState, useRef, useEffect } from "react";
import type { VersionGroupType, MessageType } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  getCurrentMessages,
  hasMultipleVersions,
  getVersionInfo,
} from "../conversation-utils";

interface ChatHomePageProps {
  versionGroups: VersionGroupType[];
}

export const ChatHomePage: React.FC<ChatHomePageProps> = ({
  versionGroups: initialVersionGroups,
}) => {
  const params = useParams();
  const { query: firstQuery, clearQuery } = useQueryStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [versionGroups, setVersionGroups] =
    useState<VersionGroupType[]>(initialVersionGroups);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [currentVersionIndices, setCurrentVersionIndices] = useState<
    Record<string, number>
  >({});

  const allMessages = getCurrentMessages(versionGroups, currentVersionIndices);

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

  const navigateVersion = async (
    groupId: string,
    direction: "prev" | "next"
  ) => {
    const group = versionGroups.find((g) => g.id === groupId);
    if (!group) return;

    const totalPairs = Math.floor(group.versions.length / 2);
    const currentIndex = currentVersionIndices[groupId] || 0;
    const normalizedCurrentIndex = Math.floor(currentIndex / 2) * 2;
    const currentPairIndex = Math.floor(normalizedCurrentIndex / 2);

    let newPairIndex = currentPairIndex;
    if (direction === "prev" && currentPairIndex > 0) {
      newPairIndex = currentPairIndex - 1;
    } else if (direction === "next" && currentPairIndex < totalPairs - 1) {
      newPairIndex = currentPairIndex + 1;
    }

    const newIndex = newPairIndex * 2;
    if (newIndex === normalizedCurrentIndex) return;

    try {
      const response = await fetch(
        `/api/conversations/${params.chatId}/update-group/${groupId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index: newIndex }),
        }
      );
      if (!response.ok) throw new Error("Failed to update version");
      setCurrentVersionIndices((prev) => ({ ...prev, [groupId]: newIndex }));
      await refreshVersions();
    } catch (error) {
      console.error("Error switching versions:", error);
      toast.error("Failed to switch versions");
    }
  };

  const formSchema = z.object({
    query: z.string().min(1, "Empty query is not allowed"),
  });

  type FormType = z.infer<typeof formSchema>;

  const form = useForm<FormType>({
    defaultValues: { query: "" },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormType) => {
    if (!values.query.trim()) return;
    form.reset();
    setIsLoading(true);

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
        body: JSON.stringify({
          query: values.query,
          isFirstQuery: firstQuery ? true : false,
        }),
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
      setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const onSubmitWithFiles = async (
    values: { query: string },
    files: File[]
  ) => {
    if (!values.query.trim() && files.length === 0) return;
    form.reset();
    setIsLoading(true);

    try {
      const tempUserMessageId = `temp-user-${Date.now()}`;
      const tempVersionGroupId = `temp-${Date.now()}`;

      const tempVersionGroup: VersionGroupType = {
        id: tempVersionGroupId,
        createdAt: new Date(),
        conversationId: params.chatId as string,
        versions: [],
        messages: [
          {
            id: tempUserMessageId,
            createdAt: new Date(),
            updatedAt: new Date(),
            conversationId: params.chatId as string,
            versionGroupId: tempVersionGroupId,
            sender: "user",
            content: values.query,
            role: "user",
            files: files.map((file, index) => ({
              id: `temp-file-${Date.now()}-${index}`,
              createdAt: new Date(),
              userId: "temp",
              conversationId: params.chatId as string,
              messageId: tempUserMessageId,
              fileName: file.name,
              fileType: file.type,
              storageUrl: "",
            })),
            streaming: false,
          },
        ],
      };

      setVersionGroups((prev) => [...prev, tempVersionGroup]);

      const formData = new FormData();
      formData.append("query", values.query);
      files.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      const res = await fetch(
        `/api/conversations/${params.chatId}/query-file`,
        {
          method: "POST",
          body: formData,
        }
      );
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
      setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleEditMessage = (message: MessageType) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleEditSubmit = async (values: { content: string }) => {
    if (!editingMessageId) return;

    const messageToEdit = allMessages.find((m) => m.id === editingMessageId);
    if (!messageToEdit || messageToEdit.role !== "user") return;

    setEditingMessageId(null);
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/conversations/${params.chatId}/edit/${editingMessageId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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

      const newVersionIndex = group.versions.length;
      const newUserMessageId = `editing-user-${Date.now()}`;

      const newUserMessage: MessageType = {
        id: newUserMessageId,
        createdAt: new Date(),
        updatedAt: new Date(),
        conversationId: params.chatId as string,
        versionGroupId: groupId,
        sender: "user",
        content: values.content,
        role: "user",
        files: messageToEdit.files || [],
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

      setCurrentVersionIndices((prev) => ({
        ...prev,
        [groupId]: newVersionIndex,
      }));

      setVersionGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                versions: [...g.versions, newUserMessage.id, newAIMessage.id],
                messages: [...g.messages, newUserMessage, newAIMessage],
              }
            : g
        )
      );
      setIsLoading(false);
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

      await refreshVersions();
    } catch (error: any) {
      console.error("Edit error:", error);
      toast.error(
        error.response?.data?.error || error.message || "Failed to edit message"
      );
      setEditingMessageId(editingMessageId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  useEffect(() => {
    const callFirstQuery = async () => {
      form.setValue("query", firstQuery!);
      await onSubmit({ query: firstQuery! });
      clearQuery();
    };
    if (firstQuery) {
      callFirstQuery();
    }
  }, [firstQuery]);

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
            <MessageList
              messages={allMessages}
              onEditMessage={handleEditMessage}
              hasMultipleVersions={(groupId) =>
                hasMultipleVersions(versionGroups, groupId)
              }
              getVersionInfo={(groupId) =>
                getVersionInfo(versionGroups, currentVersionIndices, groupId)
              }
              navigateVersion={navigateVersion}
            />
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

      <ChatInput
        form={form}
        onSubmit={onSubmit}
        onSubmitWithFiles={onSubmitWithFiles}
        isLoading={isLoading}
      />

      <EditMessageDialog
        open={editingMessageId !== null}
        onOpenChange={() => setEditingMessageId(null)}
        content={editContent}
        onSubmit={handleEditSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};
