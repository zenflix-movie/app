"use client";

import { StarRating } from "./StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { api } from "~/trpc/react";

interface ReviewListProps {
  videoId: string;
}

export function ReviewList({ videoId }: ReviewListProps) {
  const { data, isLoading } = api.reviews.listByVideo.useQuery({ videoId });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  if (!data?.items.length) return <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>;

  return (
    <div className="space-y-4">
      {data.items.map((review) => (
        <div key={review.id} className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={review.profile.avatarUrl ?? undefined} alt={review.profile.name} />
            <AvatarFallback className="text-xs">
              {review.profile.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{review.profile.name}</span>
              <StarRating value={review.rating} readOnly size="sm" />
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
