import { db } from "~/server/db";
import { GoogleCalendarService } from "./google";

/**
 * Handles calendar authorization when a user signs in with Google
 */
export async function handleGoogleAuthForCalendar(
  userId: string,
  account: any,
): Promise<void> {
  console.log("handleGoogleAuthForCalendar called", {
    userId,
    provider: account?.provider,
    hasRefreshToken: !!account?.refresh_token,
    hasAccessToken: !!account?.access_token,
    scope: account?.scope,
  });

  try {
    if (
      account.provider === "google" &&
      account.refresh_token &&
      account.access_token
    ) {
      // Check for calendar scope in token
      const hasCalendarScope = account.scope?.includes(
        "https://www.googleapis.com/auth/calendar",
      );

      if (!hasCalendarScope) {
        console.log(
          "Google account doesn't have calendar scope. Available scopes:",
          account.scope,
        );
        return;
      }

      const googleService = new GoogleCalendarService();

      // Attempt to find existing connection
      const existingConnection = await db.calendarConnection.findFirst({
        where: {
          userId,
          provider: "google",
        },
      });

      if (existingConnection) {
        console.log("Existing connection found, updating...");
        // Update connection
        await db.calendarConnection.update({
          where: { id: existingConnection.id },
          data: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            tokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
            isActive: true,
          },
        });
        console.log("Connection updated successfully.");
      } else {
        console.log("No existing connection, creating new...");
        console.log("Account details for connection:", {
          providerAccountId: account.providerAccountId,
          email: account.email,
        });

        // Create new connection - we'll use the primary calendar by default
        await db.calendarConnection.create({
          data: {
            userId,
            provider: "google",
            accountEmail: account.providerAccountId || "unknown", // This is not ideal but we'll use it as a placeholder
            refreshToken: account.refresh_token,
            accessToken: account.access_token,
            tokenExpiry: account.expires_at
              ? new Date(account.expires_at * 1000)
              : null,
            calendarId: "primary",
            isActive: true,
          },
        });
        console.log("Connection created successfully.");
      }

      console.log(
        "Successfully configured calendar connection for user",
        userId,
      );
    } else {
      console.log("Missing required account properties:", {
        hasProvider: !!account?.provider,
        isGoogle: account?.provider === "google",
        hasRefreshToken: !!account?.refresh_token,
        hasAccessToken: !!account?.access_token,
      });
    }
  } catch (error) {
    console.error("Error handling Google auth for calendar:", error);
  }
}
