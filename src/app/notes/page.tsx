import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";
import { MinimalSidebar } from "../_components/Sidebar/MinimalSidebar";
import { FlowingNotesContent } from "../_components/FlowingNotesContent";

/**
 * Notes page component that handles authentication and renders the day view layout
 * with a minimalist approach following the "Space to Think" principle
 */
export default async function NotesPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F9]">
      <MinimalSidebar user={session.user} />
      <div className="flex-1 overflow-y-auto">
        <FlowingNotesContent />
      </div>
    </div>
  );
}
