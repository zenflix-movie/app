"use client";

import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-3 w-3", md: "h-5 w-5", lg: "h-7 w-7" };

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star)}
          disabled={readOnly}
          className={cn("transition-colors", !readOnly && "hover:scale-110 cursor-pointer")}
        >
          <Star
            className={cn(
              sizeMap[size],
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}
