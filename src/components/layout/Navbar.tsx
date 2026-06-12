import Link from "next/link";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";
import { NavbarClient } from "./NavbarClient";
import { MobileNav } from "./MobileNav";

export async function Navbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur h-14">
      <div className="container mx-auto flex h-14 items-center px-4 gap-1">
        <MobileNav
          isLoggedIn={!!session?.user}
          isAdmin={session?.user.role === "admin"}
        />
        <Link href="/browse" className="flex items-center gap-2 font-bold text-xl mr-6">
          <span className="text-red-600">Zen</span>flix
        </Link>

        <nav className="hidden md:flex items-center gap-4 flex-1">
          <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse
          </Link>
          <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Search
          </Link>
          {session?.user && (
            <Link href="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              My List
            </Link>
          )}
          {session?.user.role === "admin" && (
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto">
          {session?.user ? (
            <NavbarClient user={session.user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
