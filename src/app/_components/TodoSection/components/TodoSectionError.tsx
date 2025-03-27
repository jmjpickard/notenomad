import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type TodoSectionErrorProps = {
  error: Error | { message: string };
};

/**
 * Error state for the TodoSection
 */
export function TodoSectionError({ error }: TodoSectionErrorProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-red-500">
            Failed to load tasks: {error.message}
          </p>
          <p className="text-sm text-slate-500">
            Try refreshing the page or contact support if the issue persists.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
