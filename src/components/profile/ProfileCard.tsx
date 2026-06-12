"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

interface Profile {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface ProfileCardProps {
  profile: Profile;
  onClick?: () => void;
  selected?: boolean;
}

export function ProfileCard({ profile, onClick, selected }: ProfileCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-xl transition-all hover:scale-105",
        selected && "ring-2 ring-primary",
      )}
    >
      <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
        <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.name} />
        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
          {profile.name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{profile.name}</span>
    </button>
  );
}
