import { ArrowUp } from "lucide-react";
import { FilePreview } from "./file-preview";
import { FileUploader } from "./file-uploader";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React, { useRef, useEffect, useState } from "react";

interface ChatInputProps {
  isLoading: boolean;
  onSubmitWithFiles: (
    values: { query: string },
    files: File[]
  ) => Promise<void>;
  form: UseFormReturn<{ query: string }>;
  onSubmit: (values: { query: string }) => Promise<void>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  form,
  onSubmit,
  isLoading,
  onSubmitWithFiles,
}) => {
  const textareaRef = useRef<HTMLDivElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current?.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [form.watch("query")]);

  const addFiles = (newFiles: File[]) => {
    const uniqueFiles = newFiles.filter(
      (newFile) =>
        !attachedFiles.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.size === newFile.size
        )
    );

    if (uniqueFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...uniqueFiles]);
    }
  };

  const handleSubmit = async (values: { query: string }) => {
    if (attachedFiles.length > 0) {
      onSubmitWithFiles(values, attachedFiles);
    } else {
      onSubmit(values);
    }
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(handleSubmit)();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    items.forEach((item) => {
      if (
        item.type.startsWith("image/") ||
        item.type.startsWith("application/") ||
        item.type.startsWith("text/")
      ) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    });

    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-[#212121] p-4">
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="max-w-3xl mx-auto"
      >
        <div className="flex flex-col gap-2">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${file.size}-${index}`}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          <div
            className={`flex gap-2 items-center bg-[#303030] p-2 rounded-full transition-colors ${
              isDragOver
                ? "bg-[#404040] ring-2 ring-blue-500 ring-opacity-50"
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUploader
              onFilesSelected={(files) => {
                setAttachedFiles(files);
              }}
              onFilesRemoved={() => {
                setAttachedFiles([]);
              }}
              currentFiles={attachedFiles}
            />
            <div
              className="flex-1 items-center justify-center"
              ref={textareaRef}
            >
              <Textarea
                {...form.register("query")}
                placeholder="Ask anything"
                className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent placeholder:text-gray-400 text-foreground focus:outline-none focus:ring-0 px-0 py-2"
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                id="querybox"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={
                isLoading ||
                (!form.watch("query")?.trim() && attachedFiles.length === 0)
              }
              className="h-11 w-11 shrink-0 bg-white rounded-full"
            >
              <ArrowUp className="size-5 text-black" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
