import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "~/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth();
  const cookiesList = await cookies();

  // Get all auth-related cookies for debugging
  const allCookies = cookiesList.getAll();
  const authCookies = allCookies.filter(
    (cookie) =>
      cookie.name.includes("next-auth") || cookie.name.includes("session"),
  );

  return NextResponse.json({
    isAuthenticated: !!session,
    sessionData: session,
    authCookies: authCookies.map((c) => ({ name: c.name, value: "REDACTED" })),
    headers: Object.fromEntries([...req.headers]),
  });
}
