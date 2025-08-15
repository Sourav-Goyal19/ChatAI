import React, { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EditMessageDialogProps {
  open: boolean;
  onOpenChange: () => void;
  content: string;
  onSubmit: (values: { content: string }) => void;
  isLoading: boolean;
}

const editFormSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

type EditFormType = z.infer<typeof editFormSchema>;

export const EditMessageDialog: React.FC<EditMessageDialogProps> = ({
  open,
  onOpenChange,
  content,
  onSubmit,
  isLoading,
}) => {
  const editForm = useForm<EditFormType>({
    defaultValues: { content: "" },
    resolver: zodResolver(editFormSchema),
  });

  useEffect(() => {
    if (open && content) {
      editForm.reset({ content });
    }
  }, [open, content, editForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit message</DialogTitle>
        </DialogHeader>
        <form onSubmit={editForm.handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            {...editForm.register("content")}
            placeholder="Edit your message..."
            className="min-h-[100px] resize-none"
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onOpenChange}>
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
