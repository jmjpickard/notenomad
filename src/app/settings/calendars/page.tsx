"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function CalendarSettings() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch calendar connections
  const {
    data: connections,
    isLoading,
    refetch,
  } = api.calendar.getConnections.useQuery();

  // Mutations
  const deleteConnectionMutation = api.calendar.deleteConnection.useMutation({
    onSuccess: () => {
      toast.success("Calendar connection removed");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove connection: ${error.message}`);
    },
  });

  const toggleActiveMutation = api.calendar.toggleConnectionActive.useMutation({
    onSuccess: () => {
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update connection: ${error.message}`);
    },
  });

  const syncCalendarsMutation = api.calendar.syncCalendars.useMutation({
    onSuccess: () => {
      toast.success("Calendars synchronized successfully");
      setIsSyncing(false);
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to sync calendars: ${error.message}`);
      setIsSyncing(false);
    },
  });

  // Handle the Connect with Google button
  const handleConnectGoogle = () => {
    void signIn("google", { callbackUrl: "/settings/calendars" });
  };

  // Handle manual sync
  const handleSync = async () => {
    setIsSyncing(true);
    await syncCalendarsMutation.mutateAsync();
  };

  // Format the last synced time
  const formatLastSynced = (date: Date | null) => {
    if (!date) return "Never";
    return `${formatDistanceToNow(date)} ago`;
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">Calendar Settings</h1>
        <p className="mt-2 text-gray-500">
          Connect your calendars to see meetings in your timeline.
        </p>
      </div>

      <div className="mb-10">
        <div className="mb-6 flex justify-between">
          <h2 className="text-2xl font-bold">Connected Calendars</h2>
          <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : connections?.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {connections.map((connection) => (
              <Card key={connection.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {connection.provider === "google"
                        ? "Google Calendar"
                        : connection.provider}
                    </CardTitle>
                    <Switch
                      checked={connection.isActive}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({
                          id: connection.id,
                          isActive: checked,
                        })
                      }
                    />
                  </div>
                  <CardDescription>{connection.accountEmail}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last synced:</span>
                      <span className="font-medium">
                        {formatLastSynced(connection.lastSynced)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Calendar ID:</span>
                      <span className="font-medium">
                        {connection.calendarId || "primary"}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground w-full"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to remove this calendar connection?",
                        )
                      ) {
                        deleteConnectionMutation.mutate({ id: connection.id });
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Connection
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="mb-4 text-gray-500">
                No calendar connections found. Connect a calendar below.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-8" />

      <div>
        <h2 className="mb-6 text-2xl font-bold">Add New Calendar</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>
                Connect with your Google account to import events.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={handleConnectGoogle} className="w-full">
                Connect with Google
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Microsoft Calendar</CardTitle>
              <CardDescription>
                Connect with your Microsoft account to import events.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button disabled className="w-full">
                Coming Soon
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
