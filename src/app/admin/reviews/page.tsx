"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { StarRating } from "~/components/review/StarRating";
import { AdminTableControls } from "~/components/admin/AdminTableControls";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { api } from "~/trpc/react";
import { Trash2 } from "lucide-react";

export default function AdminReviewsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const utils = api.useUtils();
  const { data, isLoading } = api.admin.reviews.list.useQuery({
    query: debouncedQuery || undefined,
    page,
    limit: 20,
  });

  const remove = api.admin.reviews.delete.useMutation({
    onSuccess: () => void utils.admin.reviews.list.invalidate(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reviews Moderation</h1>

      <AdminTableControls
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search by video, profile, or comment…"
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
            <TableHead>Video</TableHead>
            <TableHead>Profile</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.items.map((review) => (
            <TableRow key={review.id}>
              <TableCell className="font-medium">{review.video.name}</TableCell>
              <TableCell>{review.profile.name}</TableCell>
              <TableCell><StarRating value={review.rating} readOnly size="sm" /></TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                {review.comment ?? "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate({ id: review.id })}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
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
