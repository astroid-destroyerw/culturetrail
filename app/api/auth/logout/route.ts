import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

async function handleLogout(request: Request): Promise<NextResponse> {
  const { revokeToken } = await import("@/lib/auth");

  // Revoke in-memory token if the cookie is present
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (match) {
    revokeToken(decodeURIComponent(match[1]));
  }

  // Build redirect URL relative to the incoming request origin
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(new URL("/login", origin));

  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
