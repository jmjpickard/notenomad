"use client";

import { useState } from "react";
import { addDays, subDays } from "date-fns";
import { DayHeader } from "./DayHeader/index";
import { DayContent } from "./DayContent";
import { Sidebar } from "./Sidebar";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { useSession } from "next-auth/react";

/**
 * Main day view component that manages date state and layout with responsive design
 */
export function DayView() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  /**
   * Navigates to the previous day
   */
  const handlePreviousDay = () => {
    setCurrentDate((prevDate) => subDays(prevDate, 1));
  };

  /**
   * Navigates to the next day
   */
  const handleNextDay = () => {
    setCurrentDate((prevDate) => addDays(prevDate, 1));
  };

  /**
   * Resets to today's date
   */
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  /**
   * Toggles the mobile sidebar visibility
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <DayHeader
        date={currentDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
        _onOpenSidebar={toggleSidebar}
      />
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <DayContent date={currentDate} />
      </main>

      {/* Mobile sidebar as dialog */}
      <Dialog open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogContent className="h-screen max-w-[280px] p-0 sm:max-w-[350px]">
          {session?.user && <Sidebar user={session.user} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
