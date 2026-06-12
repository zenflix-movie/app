"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { api } from "~/trpc/react";
import { CheckCircle2, Pencil, Plus, Trash2, UploadCloud, XCircle } from "lucide-react";
import { cn, formatDuration } from "~/lib/utils";

interface Category { id: number; name: string }
interface AdminVideosClientProps { categories: Category[] }

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; filename: string }
  | { status: "done"; filename: string; key: string }
  | { status: "error"; message: string };

/** Read the duration (in seconds) of a local video file via an off-screen element. */
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    el.src = url;
  });
}

interface FileUploadFieldProps {
  label: string;
  accept: string;
  type: "video" | "thumbnail";
  required?: boolean;
  existingName?: string;
  onUploaded: (key: string, durationSeconds?: number | null) => void;
  onCleared: () => void;
  disabled?: boolean;
}

function FileUploadField({
  label,
  accept,
  type,
  required,
  existingName,
  onUploaded,
  onCleared,
  disabled,
}: FileUploadFieldProps) {
  const [state, setState] = useState<UploadState>(
    existingName ? { status: "done", filename: existingName, key: "" } : { status: "idle" },
  );
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState({ status: "uploading", progress: 0, filename: file.name });

    const durationPromise = type === "video" ? readVideoDuration(file) : Promise.resolve(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      // XHR instead of fetch: needed for upload progress events
      const key = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setState({ status: "uploading", progress: pct, filename: file.name });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const body = JSON.parse(xhr.responseText) as { key?: string; error?: string };
            if (body.key) resolve(body.key);
            else reject(new Error(body.error ?? "Upload failed"));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));

        xhr.open("POST", "/api/admin/upload");
        xhr.send(formData);
      });

      const duration = await durationPromise;
      setState({ status: "done", filename: file.name, key });
      onUploaded(key, duration);
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Upload failed" });
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClear() {
    setState({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
    onCleared();
  }

  const isUploading = state.status === "uploading";

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {state.status === "idle" && (
        <label
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border",
            "cursor-pointer p-6 transition-colors hover:border-primary hover:bg-muted/50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click to select {type} file</span>
          <span className="text-xs text-muted-foreground">{accept}</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
      )}

      {isUploading && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate max-w-[260px]">{state.filename}</span>
            <span className="font-medium tabular-nums">{state.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.status === "done" && (
        <div className="flex items-center justify-between rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="text-sm truncate">{state.filename}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleClear} className="shrink-0 h-7 w-7">
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-sm text-destructive truncate">{state.message}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleClear} className="shrink-0 h-7 w-7">
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface VideoFormValues {
  name: string;
  description: string;
  releaseYear: string;
  duration: number | null;
  categoryIds: number[];
  fileKey: string;
  thumbnailKey: string;
}

interface EditableVideo {
  id: string;
  name: string;
  description: string | null;
  releaseYear: number | null;
  duration: number | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  categories: Category[];
}

interface VideoFormDialogProps {
  categories: Category[];
  initial?: EditableVideo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

function VideoFormDialog({ categories, initial, open, onOpenChange, trigger }: VideoFormDialogProps) {
  const isEdit = !!initial;

  const emptyValues: VideoFormValues = {
    name: "",
    description: "",
    releaseYear: "",
    duration: null,
    categoryIds: [],
    fileKey: "",
    thumbnailKey: "",
  };

  const [form, setForm] = useState<VideoFormValues>(emptyValues);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              description: initial.description ?? "",
              releaseYear: initial.releaseYear ? String(initial.releaseYear) : "",
              duration: initial.duration,
              categoryIds: initial.categories.map((c) => c.id),
              // In edit mode keys stay as-is unless a new file is uploaded.
              fileKey: initial.fileUrl,
              thumbnailKey: "",
            }
          : emptyValues,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const utils = api.useUtils();
  const onSuccess = () => {
    void utils.videos.list.invalidate();
    onOpenChange(false);
  };
  const createVideo = api.videos.create.useMutation({ onSuccess });
  const updateVideo = api.videos.update.useMutation({ onSuccess });
  const isPending = createVideo.isPending || updateVideo.isPending;

  function toggleCategory(id: number) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const common = {
      name: form.name,
      description: form.description || undefined,
      releaseYear: form.releaseYear ? parseInt(form.releaseYear) : undefined,
      duration: form.duration ?? undefined,
      categoryIds: form.categoryIds,
    };

    if (isEdit) {
      updateVideo.mutate({
        id: initial.id,
        ...common,
        fileUrl: form.fileKey || undefined,
        thumbnailUrl: form.thumbnailKey || undefined,
      });
    } else {
      if (!form.fileKey) return;
      createVideo.mutate({
        ...common,
        fileUrl: form.fileKey,
        thumbnailUrl: form.thumbnailKey || undefined,
      });
    }
  }

  const canSubmit = form.name && (isEdit || form.fileKey) && !isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Video" : "Add Video"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadField
            label="Video File"
            accept="video/*"
            type="video"
            required={!isEdit}
            existingName={isEdit ? initial.fileUrl.split("/").pop() : undefined}
            onUploaded={(key, duration) =>
              setForm((f) => ({ ...f, fileKey: key, duration: duration ?? f.duration }))
            }
            onCleared={() => setForm((f) => ({ ...f, fileKey: "", duration: isEdit ? initial.duration : null }))}
            disabled={isPending}
          />
          {form.duration != null && (
            <p className="text-xs text-muted-foreground">
              Duration: {formatDuration(form.duration)}
            </p>
          )}
          <FileUploadField
            label="Thumbnail"
            accept="image/*"
            type="thumbnail"
            existingName={isEdit && initial.thumbnailUrl ? "current thumbnail" : undefined}
            onUploaded={(key) => setForm((f) => ({ ...f, thumbnailKey: key }))}
            onCleared={() => setForm((f) => ({ ...f, thumbnailKey: "" }))}
            disabled={isPending}
          />

          <div className="space-y-2">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Release Year</Label>
            <Input
              type="number"
              value={form.releaseYear}
              onChange={(e) => setForm({ ...form, releaseYear: e.target.value })}
              placeholder="2024"
              min="1888"
              max="2100"
            />
          </div>
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = form.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Video"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminVideosClient({ categories }: AdminVideosClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<EditableVideo | null>(null);

  const utils = api.useUtils();
  const deleteVideo = api.videos.delete.useMutation({
    onSuccess: () => void utils.videos.list.invalidate(),
  });

  const { data } = api.videos.list.useQuery({ limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Videos</h1>
        <VideoFormDialog
          categories={categories}
          open={addOpen}
          onOpenChange={setAddOpen}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Video
            </Button>
          }
        />
      </div>

      {editing && (
        <VideoFormDialog
          categories={categories}
          initial={editing}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((video) => (
            <TableRow key={video.id}>
              <TableCell className="font-medium">{video.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {video.categories.length
                    ? video.categories.map((cat) => (
                        <Badge key={cat.id} variant="secondary" className="text-xs">
                          {cat.name}
                        </Badge>
                      ))
                    : "—"}
                </div>
              </TableCell>
              <TableCell>{video.releaseYear ?? "—"}</TableCell>
              <TableCell>{video.duration ? formatDuration(video.duration) : "—"}</TableCell>
              <TableCell>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setEditing({
                        id: video.id,
                        name: video.name,
                        description: video.description,
                        releaseYear: video.releaseYear,
                        duration: video.duration,
                        fileUrl: video.fileUrl,
                        thumbnailUrl: video.thumbnailUrl,
                        categories: video.categories,
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVideo.mutate({ id: video.id })}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
