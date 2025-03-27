import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

export const {
  auth: uncachedAuth,
  handlers,
  signIn,
  signOut,
} = NextAuth(authConfig);

// Using cache allows auth to be used in Server Components
export const auth = cache(uncachedAuth);
