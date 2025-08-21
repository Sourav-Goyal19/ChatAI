import { z } from "zod";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FileType, MessageFileType } from "@/types";
import React, { useEffect, useState, useRef } from "react";

import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditMessageDialogProps {
  open: boolean;
  content: string;
  isLoading: boolean;
  files: MessageFileType[];
  onOpenChange: () => void;
  onSubmit: (
    values: { content: string },
    files: File[],
    keptExistingFiles: FileType[]
  ) => void;
}

const editFormSchema = z.object({
  content: z.string().min(1, "Required"),
});

type EditFormType = z.infer<typeof editFormSchema>;

const FilePreview: React.FC<{
  file: File | FileType;
  onRemove: () => void;
}> = ({ file, onRemove }) => {
  const fileName = "name" in file ? file.name : file.fileName;
  const fileType = "type" in file ? file.type : file.fileType;
  const isImage = fileType.startsWith("image/");

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-4 w-4" />;
    if (fileType === "application/pdf") return <FileText className="h-4 w-4" />;
    if (fileType.startsWith("text/")) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const getImageSource = () => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return (file as FileType).storageUrl;
  };

  if (isImage) {
    const imageSource = getImageSource();
    if (imageSource) {
      return (
        <div className="relative group">
          <Image
            src={imageSource}
            alt={fileName}
            width={80}
            height={80}
            className="rounded-lg object-cover w-20 h-20 border border-primary-foreground/20"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-medium px-1 text-center break-all">
              {fileName}
            </span>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="relative flex items-center gap-2 p-2 bg-[#404040] rounded-lg border border-primary-foreground/20 max-w-[120px]">
      {getFileIcon()}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-white">{fileName}</p>
        <p className="text-xs text-gray-400 capitalize">
          {fileType.split("/")[1] || fileType}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
      >
        <X className="h-2 w-2" />
      </button>
    </div>
  );
};

export const EditMessageDialog: React.FC<EditMessageDialogProps> = ({
  open,
  onOpenChange,
  content,
  files: initialFiles,
  onSubmit,
  isLoading,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [keptExistingFiles, setKeptExistingFiles] = useState<FileType[]>([]);
  const [originalExistingFiles, setOriginalExistingFiles] = useState<
    FileType[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editForm = useForm<EditFormType>({
    defaultValues: { content: "" },
    resolver: zodResolver(editFormSchema),
  });

  useEffect(() => {
    if (open) {
      editForm.reset({ content });
      const existing = initialFiles.filter(
        (file): file is FileType => "storageUrl" in file
      );
      setOriginalExistingFiles(existing);
      setKeptExistingFiles(existing);
      setSelectedFiles([]);
    }
  }, [open, content, initialFiles, editForm]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalFiles =
      keptExistingFiles.length + selectedFiles.length + files.length;

    if (totalFiles > 5) {
      alert("You can only attach up to 5 files total.");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingFile = (index: number) => {
    setKeptExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (values: EditFormType) => {
    if (
      !values.content.trim() &&
      keptExistingFiles.length === 0 &&
      selectedFiles.length === 0
    ) {
      editForm.setError("content", {
        message: "Please provide content or attach files",
      });
      return;
    }

    onSubmit(values, selectedFiles, keptExistingFiles);
  };

  const totalFiles = keptExistingFiles.length + selectedFiles.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit message</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={editForm.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <Textarea
            {...editForm.register("content")}
            placeholder="Edit your message..."
            className="min-h-[100px] resize-none bg-[#212121] rounded-md text-white"
            rows={4}
          />
          {editForm.formState.errors.content && (
            <p className="text-red-500 text-sm">
              {editForm.formState.errors.content.message}
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={totalFiles >= 5}
                className="flex items-center gap-2 text-white hover:text-white"
              >
                <Upload className="h-4 w-4" />
                Add Files ({totalFiles}/5)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {(keptExistingFiles.length > 0 || selectedFiles.length > 0) && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Attached files:</p>
                <div className="flex flex-wrap gap-2">
                  {keptExistingFiles.map((file, index) => (
                    <FilePreview
                      key={`existing-${file.id}`}
                      file={file}
                      onRemove={() => removeExistingFile(index)}
                    />
                  ))}
                  {selectedFiles.map((file, index) => (
                    <FilePreview
                      key={`new-${index}-${file.name}`}
                      file={file}
                      onRemove={() => removeSelectedFile(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              className="text-white"
              variant="outline"
              onClick={onOpenChange}
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
  );
};
