"use client";

import { Plus } from "lucide-react";
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
import { createSharedCurriculum } from "@/lib/actions/shared-curricula";

export function SharedCurriculumForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (!name.trim()) return;
    startTransition(async () => {
      formData.set("name", name);
      formData.set("description", description);
      await createSharedCurriculum(formData);
      setName("");
      setDescription("");
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Create Shared Curriculum
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Shared Curriculum</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shared-name">Name</Label>
            <Input
              id="shared-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Morning Group Reading"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-description">Description</Label>
            <Textarea
              id="shared-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shared-cover-image">Cover Image</Label>
            <Input
              id="shared-cover-image"
              name="coverImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileRef}
              className="text-sm"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !name.trim()}
          >
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
