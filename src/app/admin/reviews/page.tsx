"use client";

import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { StarRating } from "~/components/review/StarRating";
import { api } from "~/trpc/react";
import { Trash2 } from "lucide-react";

export default function AdminReviewsPage() {
  const utils = api.useUtils();
  const { data } = api.admin.reviews.list.useQuery({});

  const remove = api.admin.reviews.delete.useMutation({
    onSuccess: () => void utils.admin.reviews.list.invalidate(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reviews Moderation</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Video</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((review) => (
            <TableRow key={review.id}>
              <TableCell className="font-medium">{review.video.name}</TableCell>
              <TableCell>{review.user.name ?? review.user.email}</TableCell>
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
  );
}
