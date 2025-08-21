"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { File, X, Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface FileWithPreview {
  file: File;
  preview?: string;
}

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onFilesRemoved: () => void;
  maxFiles?: number;
  currentFiles: File[];
}

export const FileUploader = ({
  onFilesSelected,
  onFilesRemoved,
  maxFiles = 5,
  currentFiles = [],
}: FileUploaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previews, setPreviews] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      const filesWithPreviews = currentFiles.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      }));
      setPreviews(filesWithPreviews);
    }
  }, [isDialogOpen, currentFiles]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setError(null);
      setHasPendingChanges(true);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0].code === "file-too-large") {
          setError("File size must be less than 5MB");
        } else {
          setError(
            "Only images (JPEG, PNG, GIF, WEBP), PDFs, CSVs, and TXT files are allowed"
          );
        }
        return;
      }

      if (acceptedFiles.length + previews.length > maxFiles) {
        setError(`You can upload a maximum of ${maxFiles} files`);
        return;
      }

      const filesWithPreviews = acceptedFiles.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
      }));

      setPreviews((prev) => [...prev, ...filesWithPreviews]);
    },
    [maxFiles, previews.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev];
      const removed = newPreviews.splice(index, 1)[0];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      setHasPendingChanges(true);
      return newPreviews;
    });
  };

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.preview) URL.revokeObjectURL(preview.preview);
      });
    };
  }, [previews]);

  const handleSubmit = () => {
    if (previews.length === 0) {
      onFilesRemoved();
    } else {
      const files = previews.map((p) => p.file);
      onFilesSelected(files);
    }
    setIsDialogOpen(false);
    setHasPendingChanges(false);
  };

  const handleDialogClose = () => {
    if (hasPendingChanges) {
      handleSubmit();
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0 hover:bg-[#212121] transition rounded-full"
        type="button"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-4 w-4 text-white" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Attach Files</DialogTitle>
            <DialogDescription className="text-white">
              Upload images, PDFs, CSV, or text files (max 5MB each)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "bg-[#303030]" : "bg-[#303030]"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2 text-white">
                <Paperclip className="h-8 w-8" />
                {isDragActive ? (
                  <p className="font-medium">Drop the files here</p>
                ) : (
                  <>
                    <p className="font-medium text-sm">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, GIF, WEBP, PDF, CSV, TXT
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max {maxFiles} files, 5MB each
                    </p>
                  </>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {previews.length > 0 && (
              <div className="space-y-2 text-white">
                <h3 className="text-sm font-medium">
                  Selected Files ({previews.length}/{maxFiles})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-xl"
                    >
                      <div className="flex items-center gap-2">
                        {preview.preview ? (
                          <img
                            src={preview.preview}
                            alt={preview.file.name}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                            <File className="h-5 w-5" />
                          </div>
                        )}
                        <div className="truncate max-w-[200px]">
                          <p className="text-sm font-medium truncate">
                            {preview.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 text-white">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={previews.length <= 0}
                onClick={handleSubmit}
              >
                Attach Files
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
