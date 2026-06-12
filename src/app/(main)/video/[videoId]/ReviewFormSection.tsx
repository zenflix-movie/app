"use client";

import { ReviewForm } from "~/components/review/ReviewForm";
import { api } from "~/trpc/react";

interface ReviewFormSectionProps {
  videoId: string;
  profileId: string;
}

export function ReviewFormSection({ videoId, profileId }: ReviewFormSectionProps) {
  const { data: existing } = api.reviews.myReview.useQuery({ videoId, profileId });

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">
        {existing ? "Edit your review" : "Write a review"}
      </h3>
      <ReviewForm videoId={videoId} profileId={profileId} existingReview={existing} />
    </div>
  );
}
