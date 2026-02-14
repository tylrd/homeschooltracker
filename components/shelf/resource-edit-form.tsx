"use client";

import { Pencil } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateResource } from "@/lib/actions/resources";

export function ResourceEditForm({
  resourceId,
  studentId,
  currentName,
}: {
  resourceId: string;
  studentId: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(currentName);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
    setOpen(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      formData.set("name", name);
      await updateResource(resourceId, studentId, formData);
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Edit resource"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-resource-name">Name</Label>
            <Input
              id="edit-resource-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-resource-cover">Cover Image</Label>
            <Input
              id="edit-resource-cover"
              ref={fileRef}
              name="coverImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to keep current cover.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !name.trim()}
          >
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
