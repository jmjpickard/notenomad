import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";
import { DayView } from "./_components/DayView";

/**
 * Main page component that handles authentication and renders the day view
 */
export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <DayView />
    </div>
  );
}
