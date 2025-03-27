"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

type UserProfileProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

/**
 * Component to display user profile information including avatar and name
 */
export function UserProfile({ user }: UserProfileProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "?";

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-12 w-12 border border-[#E0E0E0]">
        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
        <AvatarFallback className="bg-[#4A90E2] text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-[#2C3E50]">{user.name || "User"}</p>
        {user.email && <p className="text-sm text-[#607D8B]">{user.email}</p>}
      </div>
    </div>
  );
}
