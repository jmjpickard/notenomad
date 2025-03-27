"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Dispatch, SetStateAction } from "react";

type DayHeaderProps = {
  date: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onChangeDate?: Dispatch<SetStateAction<Date>>;
  onOpenSidebar?: () => void;
};

/**
 * Minimal header component for the day view that displays the current date and navigation controls
 */
export function DayHeader({
  date,
  onPreviousDay,
  onNextDay,
  onToday,
  onChangeDate,
  onOpenSidebar,
}: DayHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E0E0E0] bg-[#F9F9F9] px-6 py-6">
      <h1 className="font-fraunces text-xl font-bold text-[#2C3E50] sm:text-2xl md:text-3xl">
        {format(date, "EEEE, d MMMM yyyy")}
      </h1>
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-2" aria-label="Day navigation">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousDay}
            className="text-[#424242] hover:bg-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden text-sm text-[#2C3E50] hover:bg-[#F0F0F0] hover:font-medium md:inline-flex"
            aria-label="Today"
            onClick={onToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextDay}
            className="text-[#424242] hover:bg-[#F5F5F5] focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="ml-2 text-[#4A90E2]"
              aria-label="Quick actions"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Note</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Meeting</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
