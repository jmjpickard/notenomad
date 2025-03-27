import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "../db";
import { sendMagicLinkEmail } from "../../lib/email";
import { env } from "../../env";
import { handleGoogleAuthForCalendar } from "../services/calendar/auth-handler";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Extended user type including password field for auth
 */
type UserWithPassword = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
};

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  secret: env.AUTH_SECRET,

  // Force JWT session strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    // No need to specify secret again, it's taken from the top-level secret
  },

  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: env.RESEND_API_KEY,
        },
        secure: true,
      },
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url }) {
        console.log("Magic link verification URL:", url);

        // Log the parsed URL to debug potential issues
        try {
          const parsedUrl = new URL(url);
          console.log("Magic link URL parts:", {
            origin: parsedUrl.origin,
            pathname: parsedUrl.pathname,
            searchParams: Object.fromEntries(parsedUrl.searchParams.entries()),
          });
        } catch (error) {
          console.error("Error parsing magic link URL:", error);
        }

        await sendMagicLinkEmail(email, url);
      },
      // Increase max token age to ensure it doesn't expire too quickly during testing
      maxAge: 15 * 60, // 15 minutes in seconds
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new Error("Invalid credentials");
        }

        const { email, password } = parsedCredentials.data;
        const user = (await db.user.findUnique({
          where: { email },
        })) as UserWithPassword | null;

        if (!user || !user.password) {
          throw new Error("User not found or invalid login method");
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    signIn({ user, account, profile, email, credentials }) {
      console.log("SignIn callback triggered:", {
        user,
        account: {
          ...account,
          scope: account?.scope,
          provider: account?.provider,
          refresh_token: !!account?.refresh_token,
          access_token: !!account?.access_token,
        },
        profile,
      });

      // Store calendar connection if using Google provider
      if (account && account.provider === "google" && user && user.id) {
        // Non-blocking - we don't want to fail sign-in if calendar setup fails
        handleGoogleAuthForCalendar(user.id, account).catch((error) => {
          console.error("Error configuring calendar during sign-in:", error);
        });
      }

      return true;
    },
    jwt({ token, account }) {
      // Save the access token and refresh token to the token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    session: ({ session, user, token }) => {
      console.log("Session callback triggered:", { session, user, token });
      return {
        ...session,
        user: {
          ...session.user,
          id: user?.id || token?.sub,
        },
        accessToken: token.accessToken,
      };
    },
    redirect({ url, baseUrl }) {
      console.log("Redirect callback URL:", url, "Base URL:", baseUrl);
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        console.log(`Returning relative URL: ${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        console.log(`Returning same-origin URL: ${url}`);
        return url;
      }
      // Default to notes page
      console.log(`Returning default URL: ${baseUrl}/notes`);
      return `${baseUrl}/notes`;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
