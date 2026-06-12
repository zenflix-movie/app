"use client";

import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import Link from "next/link";

interface NavbarClientProps {
  user: { name?: string | null; email?: string | null; role: string };
}

export function NavbarClient({ user }: NavbarClientProps) {
  const displayName = user.name ?? user.email ?? "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="bg-red-600 text-white text-sm">
              {displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium truncate">{displayName}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profiles">Switch Profile</Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">Admin Panel</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-destructive"
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
