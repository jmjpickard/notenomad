import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Notes | NoteNomad",
  description: "Organise your day with notes, tasks and meetings in one place",
};

export default function NotesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
