import { Card, CardContent, CardHeader } from "~/components/ui/card";

/**
 * Skeleton loading state for the TodoSection
 */
export function TodoSectionSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-6 w-16 animate-pulse rounded bg-slate-200"></div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200"></div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="h-8 w-full animate-pulse rounded bg-slate-200"></div>
          <div className="h-8 w-full animate-pulse rounded bg-slate-200"></div>
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200"></div>
        </div>
      </CardContent>
    </Card>
  );
}
