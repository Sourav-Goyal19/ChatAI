import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import MDEditor from "@uiw/react-md-editor";
import type { MessageType, FileType } from "@/types";
import { VersionNavigation } from "./version-navigation";

import {
  Copy,
  Edit3,
  FileText,
  File as FileIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  messages: MessageType[];
  onEditMessage: (message: MessageType) => void;
  hasMultipleVersions: (groupId: string) => boolean;
  getVersionInfo: (groupId: string) => { current: number; total: number };
  navigateVersion: (groupId: string, direction: "prev" | "next") => void;
}

const FileDisplay: React.FC<{ file: FileType | File | any }> = ({ file }) => {
  const normalizedFile = React.useMemo(() => {
    if (file instanceof File) {
      return {
        fileName: file.name,
        fileType: file.type,
        storageUrl: URL.createObjectURL(file),
        isTemp: true,
      };
    }

    if (file && typeof file === "object") {
      return {
        fileName: file.fileName || file.name,
        fileType: file.fileType || file.type,
        storageUrl: file.storageUrl || file.url,
        id: file.id,
      };
    }

    console.warn("Invalid file object:", file);
    return null;
  }, [file]);

  if (!normalizedFile) return null;

  const { fileName, fileType, storageUrl } = normalizedFile;
  const isImage = fileType?.startsWith("image/");
  const isPDF = fileType === "application/pdf";
  const isText = fileType?.startsWith("text/");

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4" />;
    if (isPDF) return <FileText className="h-4 w-4" />;
    if (isText) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  if (isImage && storageUrl) {
    return (
      <div className="relative group cursor-pointer">
        <Image
          src={storageUrl}
          alt={fileName}
          width={200}
          height={200}
          className="rounded-lg object-cover max-w-xs max-h-48 border border-primary-foreground/20"
          style={{ width: "auto", height: "auto" }}
          onError={(e) => {
            console.warn(`Failed to load image: ${fileName}`);
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-medium">{fileName}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-[#404040] rounded-lg border border-primary-foreground/20 max-w-xs">
      {getFileIcon()}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-white">{fileName}</p>
        <p className="text-xs text-gray-400 capitalize">
          {fileType?.split("/")[1] || fileType || "file"}
        </p>
      </div>
    </div>
  );
};

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

        return (
          <div key={message.id}>
            <div
              className={`flex gap-4 group relative ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="relative max-w-[100%]">
                <div className="p-4 rounded-2xl">
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
                    <div className="space-y-3">
                      {message.files && message.files.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {message.files.map((file, index) => {
                              const fileKey =
                                "id" in file
                                  ? file.id
                                  : `temp-${index}-${file.name || "file"}`;

                              return <FileDisplay key={fileKey} file={file} />;
                            })}
                          </div>
                        </div>
                      )}
                      {message.content && (
                        <p
                          className={cn(
                            "text-sm p-4 rounded-full leading-relaxed whitespace-pre-wrap text-white",
                            message.role == "user" && "bg-[#303030]"
                          )}
                        >
                          {message.content}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "flex items-center group gap-4 ml-3 mt-1",
                    message.role == "user" && "justify-end ml-0 mr-2"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-white hover:bg-[#303030]"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      toast.success("Text copied to clipboard.");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {message.role == "user" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-white hover:bg-[#303030]"
                      onClick={() => onEditMessage(message)}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
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
            </div>
          </div>
        );
      })}
    </>
  );
};
