"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { StarRating } from "./StarRating";
import { api } from "~/trpc/react";

interface ReviewFormProps {
  videoId: string;
  existingReview?: { id: string; rating: number; comment?: string | null } | null;
  onSuccess?: () => void;
}

export function ReviewForm({ videoId, existingReview, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");

  const utils = api.useUtils();

  const create = api.reviews.create.useMutation({
    onSuccess: () => {
      void utils.reviews.listByVideo.invalidate({ videoId });
      void utils.reviews.myReview.invalidate({ videoId });
      onSuccess?.();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    create.mutate({ videoId, rating, comment: comment || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Your rating:</span>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review (optional)"
        rows={3}
      />
      <Button type="submit" disabled={rating === 0 || create.isPending} size="sm">
        {create.isPending ? "Saving…" : existingReview ? "Update Review" : "Submit Review"}
      </Button>
    </form>
  );
}
