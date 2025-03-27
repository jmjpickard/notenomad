"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Wrapper component for NextAuth SessionProvider to use in client components
 */
export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
};
