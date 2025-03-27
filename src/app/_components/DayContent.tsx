"use client";

import { useState, useEffect } from "react";
import { Card } from "~/components/ui/card";
import { TodoSection } from "./TodoSection/index";
import { MeetingsTimeline } from "./MeetingsTimeline/index";
import { NotesSection } from "./NotesSection/index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

type DayContentProps = {
  date: Date;
};

/**
 * Content component for the day view that displays todos, meetings, and notes in a responsive layout
 */
export function DayContent({ date }: DayContentProps) {
  const [isClient, setIsClient] = useState<boolean>(false);

  // Ensure hydration is complete before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-64 rounded-md bg-slate-200"></div>
          <div className="h-32 rounded-md bg-slate-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop layout - side by side */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        <Card className="h-fit p-6">
          <TodoSection date={date} />
        </Card>
        <Card className="col-span-2 p-6">
          <NotesSection date={date} />
        </Card>
      </div>

      {/* Mobile/Tablet layout - tabbed interface */}
      <div className="lg:hidden">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="todos">Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="notes">
            <Card className="p-6">
              <NotesSection date={date} />
            </Card>
          </TabsContent>
          <TabsContent value="todos">
            <Card className="p-6">
              <TodoSection date={date} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Meetings timeline - always full width */}
      <Card className="p-6">
        <MeetingsTimeline date={date} />
      </Card>
    </div>
  );
}
