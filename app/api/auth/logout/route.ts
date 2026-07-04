import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: Request) {
  const { revokeToken } = await import("@/lib/auth");

  // Revoke the token from memory if present in cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (match) {
    revokeToken(decodeURIComponent(match[1]));
  }

  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/login`);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}

// Also support POST for form submissions
export async function POST(request: Request) {
  return GET(request);
}
