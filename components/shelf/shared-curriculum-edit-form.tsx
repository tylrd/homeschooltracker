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
import { Textarea } from "@/components/ui/textarea";
import { updateSharedCurriculum } from "@/lib/actions/shared-curricula";

export function SharedCurriculumEditForm({
  sharedCurriculumId,
  currentName,
  currentDescription,
}: {
  sharedCurriculumId: string;
  currentName: string;
  currentDescription: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(currentName);
      setDescription(currentDescription ?? "");
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
    setOpen(nextOpen);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      formData.set("name", name);
      formData.set("description", description);
      await updateSharedCurriculum(sharedCurriculumId, formData);
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
          aria-label="Edit curriculum"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Curriculum</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-curriculum-name">Name</Label>
            <Input
              id="edit-curriculum-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-curriculum-description">Description</Label>
            <Textarea
              id="edit-curriculum-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-curriculum-cover">Cover Image</Label>
            <Input
              id="edit-curriculum-cover"
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
