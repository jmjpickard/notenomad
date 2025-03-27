import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type MeetingsTimelineProps = {
  _date: Date;
};

/**
 * Displays a placeholder for the day's meetings in chronological order
 */
export function MeetingsTimeline({ _date }: MeetingsTimelineProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Meetings</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add meeting</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-slate-500">No meetings scheduled today.</p>
          <p className="text-sm text-slate-500">
            Click the + button to add a meeting.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
