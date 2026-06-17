"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AdminTableControls } from "~/components/admin/AdminTableControls";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { api } from "~/trpc/react";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface EditingCategory {
  id: number;
  name: string;
  description: string;
}

export default function AdminCategoriesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<EditingCategory | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const utils = api.useUtils();
  const { data, isLoading } = api.admin.categories.list.useQuery({
    query: debouncedQuery || undefined,
    page,
    limit: 20,
  });

  const create = api.categories.create.useMutation({
    onSuccess: () => {
      void utils.admin.categories.list.invalidate();
      void utils.categories.list.invalidate();
      setAddOpen(false);
      setName("");
      setDescription("");
    },
  });

  const update = api.categories.update.useMutation({
    onSuccess: () => {
      void utils.admin.categories.list.invalidate();
      void utils.categories.list.invalidate();
      setEditing(null);
    },
  });

  const remove = api.categories.delete.useMutation({
    onSuccess: () => {
      void utils.admin.categories.list.invalidate();
      void utils.categories.list.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate({ name, description: description || undefined });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AdminTableControls
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search categories…"
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          {editing && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update.mutate({
                  id: editing.id,
                  name: editing.name,
                  description: editing.description || null,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium">{cat.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{cat.description ?? "—"}</TableCell>
              <TableCell>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setEditing({ id: cat.id, name: cat.name, description: cat.description ?? "" })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove.mutate({ id: cat.id })}
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
    </div>
  );
}
