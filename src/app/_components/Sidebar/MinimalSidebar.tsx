"use client";

import { Home, CheckSquare, LogOut, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useState } from "react";
import { TodoOverlay } from "../TodoOverlay";
import { ThemeToggle } from "~/components/theme-toggle";

type MinimalSidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

/**
 * Minimised sidebar component that includes navigation icons and user profile
 */
export function MinimalSidebar({ user }: MinimalSidebarProps) {
  const pathname = usePathname();
  const [todoOverlayOpen, setTodoOverlayOpen] = useState<boolean>(false);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "?";

  /**
   * Toggles the todo overlay visibility
   */
  const toggleTodoOverlay = () => {
    setTodoOverlayOpen(!todoOverlayOpen);
  };

  return (
    <>
      <aside
        className="sticky top-0 flex h-screen w-16 flex-col items-center border-r border-[#E0E0E0] bg-white py-6 dark:border-slate-700 dark:bg-slate-900"
        aria-label="Navigation"
      >
        <div className="flex flex-col items-center space-y-6">
          <Link href="/notes" passHref>
            <Button
              variant="ghost"
              size="icon"
              className={`text-[#424242] hover:bg-[#F5F5F5] dark:text-slate-300 dark:hover:bg-slate-800 ${
                pathname === "/notes" ? "bg-[#F5F5F5] dark:bg-slate-800" : ""
              }`}
              aria-label="Home"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTodoOverlay}
            className="text-[#424242] hover:bg-[#F5F5F5] dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Todo list"
          >
            <CheckSquare className="h-5 w-5" aria-hidden="true" />
          </Button>

          <Link href="/settings/calendars" passHref>
            <Button
              variant="ghost"
              size="icon"
              className={`text-[#424242] hover:bg-[#F5F5F5] dark:text-slate-300 dark:hover:bg-slate-800 ${
                pathname === "/settings/calendars"
                  ? "bg-[#F5F5F5] dark:bg-slate-800"
                  : ""
              }`}
              aria-label="Calendar Settings"
            >
              <Calendar className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        <div className="mt-auto space-y-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-10 w-10 cursor-pointer border border-[#E0E0E0] dark:border-slate-700">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback className="bg-[#4A90E2] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="font-medium">
                {user.name || "User"}
              </DropdownMenuItem>
              <form action="/api/auth/signout" method="post">
                <DropdownMenuItem className="gap-2 text-[#E07A5F]" asChild>
                  <button type="submit" className="w-full">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {todoOverlayOpen && (
        <TodoOverlay onClose={() => setTodoOverlayOpen(false)} />
      )}
    </>
  );
}
