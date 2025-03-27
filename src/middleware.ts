import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { type NextRequest } from "next/server";
import { env } from "./env";

/**
 * Middleware that handles authentication-based redirects
 */
export default async function middleware(req: NextRequest) {
  // Skip middleware for API routes completely
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Special handling for callback endpoints - always allow without redirect
  if (
    req.nextUrl.pathname.includes("/callback") ||
    req.nextUrl.pathname.includes("/signin")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: env.AUTH_SECRET,
  });
  const isAuthenticated = !!token;

  // Define paths that require authentication
  const authRequiredPaths = ["/", "/meetings", "/notes"];

  // Define authentication-related paths
  const authPaths = ["/auth/signin", "/auth/signup", "/auth/verify-request"];

  // Check if the current path requires authentication
  const isAuthRequired = authRequiredPaths.some(
    (path) =>
      req.nextUrl.pathname === path ||
      (path !== "/" && req.nextUrl.pathname.startsWith(path)),
  );

  // Check if the current path is an authentication path
  const isAuthPath = authPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path),
  );

  // If the path requires authentication and the user is not authenticated,
  // redirect to the sign-in page
  if (isAuthRequired && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If the user is authenticated and trying to access an authentication page,
  // redirect to the notes page instead of root
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL("/notes", req.url));
  }

  // If the user is authenticated and trying to access the root path,
  // redirect to the notes page
  if (isAuthenticated && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/notes", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
