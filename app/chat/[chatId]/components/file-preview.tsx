import { File, Image, X } from "lucide-react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  return (
    <div className="relative group">
      {file.type.startsWith("image/") ? (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="h-12 w-12 object-cover rounded border"
        />
      ) : (
        <div className="h-12 w-12 flex items-center justify-center bg-muted rounded border">
          <File className="h-5 w-5" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
