"use client";

import { LogOut, Home, Calendar, Settings } from "lucide-react";
import { Button } from "~/components/ui/button";
import { UserProfile } from "../Sidebar/UserProfile";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "~/components/theme-toggle";

type SidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

/**
 * Sidebar component that displays user information and navigation options
 */
export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-full flex-col border-r border-[#E0E0E0] bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      aria-label="Main navigation"
    >
      <div className="mb-8">
        <UserProfile user={user} />
      </div>

      <nav className="space-y-2">
        <Link href="/notes" passHref>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-2 text-[#424242] hover:bg-[#F5F5F5] dark:text-slate-300 dark:hover:bg-slate-800 ${
              pathname === "/notes" ? "bg-[#F5F5F5] dark:bg-slate-800" : ""
            }`}
          >
            <Home className="h-5 w-5" aria-hidden="true" />
            <span>Home</span>
          </Button>
        </Link>

        <Link href="/calendar" passHref>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-2 text-[#424242] hover:bg-[#F5F5F5] dark:text-slate-300 dark:hover:bg-slate-800 ${
              pathname === "/calendar" ? "bg-[#F5F5F5] dark:bg-slate-800" : ""
            }`}
          >
            <Calendar className="h-5 w-5" aria-hidden="true" />
            <span>Calendar</span>
          </Button>
        </Link>

        <Link href="/settings" passHref>
          <Button
            variant="ghost"
            className={`w-full justify-start gap-2 text-[#424242] hover:bg-[#F5F5F5] dark:text-slate-300 dark:hover:bg-slate-800 ${
              pathname === "/settings" ? "bg-[#F5F5F5] dark:bg-slate-800" : ""
            }`}
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
            <span>Settings</span>
          </Button>
        </Link>
      </nav>

      <div className="mt-auto space-y-2">
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        <form action="/api/auth/signout" method="post">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-[#E07A5F] hover:bg-[#F5F5F5] dark:text-[#E07A5F] dark:hover:bg-slate-800"
            type="submit"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            <span>Sign out</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}
