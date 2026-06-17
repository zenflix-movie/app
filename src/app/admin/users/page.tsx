"use client";

import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { AdminTableControls } from "~/components/admin/AdminTableControls";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { api } from "~/trpc/react";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const utils = api.useUtils();
  const { data, isLoading } = api.admin.users.list.useQuery({
    query: debouncedQuery || undefined,
    page,
    limit: 20,
  });

  const updateRole = api.admin.users.updateRole.useMutation({
    onSuccess: () => void utils.admin.users.list.invalidate(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>

      <AdminTableControls
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search users by name or email…"
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="hidden sm:table-cell">{user.name ?? "—"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateRole.mutate({
                      id: user.id,
                      role: user.role === "admin" ? "member" : "admin",
                    })
                  }
                  disabled={updateRole.isPending}
                >
                  {user.role === "admin" ? "Demote" : "Promote"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
