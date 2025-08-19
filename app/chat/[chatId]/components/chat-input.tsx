import { ArrowUp, Send } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import React, { useRef, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "./file-uploader";
import { FilePreview } from "./file-preview";

interface ChatInputProps {
  form: UseFormReturn<{ query: string }>;
  onSubmit: (values: { query: string }) => Promise<void>;
  onSubmitWithFiles: (
    values: { query: string },
    files: File[]
  ) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  form,
  onSubmit,
  onSubmitWithFiles,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLDivElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  useEffect(() => {
    const textarea = textareaRef.current?.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [form.watch("query")]);

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
                  key={index}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center bg-[#303030] p-2 rounded-full">
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
                placeholder="Type your message here..."
                className="min-h-[44px] max-h-[120px] resize-none border-0"
                onKeyDown={handleKeyDown}
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
