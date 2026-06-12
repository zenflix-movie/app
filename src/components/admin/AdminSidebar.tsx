"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reviews", label: "Reviews" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r min-h-screen px-3 py-6">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
        Admin Panel
      </p>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted",
              pathname === link.href && "bg-muted text-foreground",
              pathname !== link.href && "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
