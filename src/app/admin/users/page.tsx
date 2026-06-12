"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function AdminUsersPage() {
  const utils = api.useUtils();
  const { data } = api.admin.users.list.useQuery({});

  const updateRole = api.admin.users.updateRole.useMutation({
    onSuccess: () => void utils.admin.users.list.invalidate(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
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
