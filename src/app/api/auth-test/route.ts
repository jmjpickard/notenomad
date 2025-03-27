import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { cookies, headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { env } from "~/env";

export async function GET(req: NextRequest) {
  try {
    // Get session using the auth() method
    const session = await auth();

    // Get token directly using getToken
    const token = await getToken({
      req,
      secret: env.AUTH_SECRET,
    });

    // Collect cookies for debugging
    const cookieList = cookies();
    const allCookies = cookieList.getAll();
    const authCookies = allCookies.filter(
      (cookie) =>
        cookie.name.includes("next-auth") || cookie.name.includes("session"),
    );

    // Get all environment variables related to auth
    const authEnvVars = {
      AUTH_SECRET: env.AUTH_SECRET ? "Set (value hidden)" : "Not set",
      AUTH_URL: env.AUTH_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
      NODE_ENV: process.env.NODE_ENV || "Not set",
    };

    return NextResponse.json({
      isAuthenticated: !!session,
      sessionData: session,
      tokenExists: !!token,
      tokenData: token
        ? {
            ...token,
            // Hide sensitive values
            sub: token.sub ? "Exists (value hidden)" : null,
            jti: token.jti ? "Exists (value hidden)" : null,
          }
        : null,
      authCookies: authCookies.map((c) => ({
        name: c.name,
        value: "REDACTED",
      })),
      authEnvVars,
      headersList: Object.fromEntries([...headers()]),
      requestInfo: {
        url: req.url,
        method: req.method,
        nextUrl: {
          pathname: req.nextUrl.pathname,
          search: req.nextUrl.search,
          origin: req.nextUrl.origin,
        },
      },
    });
  } catch (error) {
    console.error("Auth test API error:", error);
    return NextResponse.json(
      {
        error: "Error fetching auth data",
        message: error instanceof Error ? error.message : String(error),
        stack:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 },
    );
  }
}
