import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot, User, Edit3, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MessageType } from "@/types";
import { VersionNavigation } from "./version-navigation";

interface MessageListProps {
  messages: MessageType[];
  onEditMessage: (message: MessageType) => void;
  hasMultipleVersions: (groupId: string) => boolean;
  getVersionInfo: (groupId: string) => { current: number; total: number };
  navigateVersion: (groupId: string, direction: "prev" | "next") => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onEditMessage,
  hasMultipleVersions,
  getVersionInfo,
  navigateVersion,
}) => {
  return (
    <>
      {messages.map((message) => {
        const versionInfo = getVersionInfo(message.versionGroupId);
        const showVersionControls =
          hasMultipleVersions(message.versionGroupId) &&
          message.role === "user";

        const fileCount =
          message.role === "user" ? message.files?.length || 0 : 0;

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
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {fileCount > 0 && (
                        <div className="flex items-center gap-1 text-xs opacity-80 pt-1 border-t border-primary-foreground/20">
                          <Paperclip className="h-3 w-3" />
                          <span>
                            {fileCount} {fileCount === 1 ? "File" : "Files"}{" "}
                            attached
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {message.role === "user" && fileCount === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-background border border-border shadow-sm hover:bg-accent"
                    onClick={() => onEditMessage(message)}
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
              <VersionNavigation
                versionInfo={versionInfo}
                onNavigate={(direction) =>
                  navigateVersion(message.versionGroupId, direction)
                }
              />
            )}
          </div>
        );
      })}
    </>
  );
};
