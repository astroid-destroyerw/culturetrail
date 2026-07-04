import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    const expectedUsername = process.env.APP_USERNAME;
    const expectedPassword = process.env.APP_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      console.error("APP_USERNAME or APP_PASSWORD not set in environment variables.");
      return NextResponse.json(
        { error: "Auth is not configured on this server." },
        { status: 500 }
      );
    }

    if (
      !username ||
      !password ||
      username.trim() !== expectedUsername ||
      password !== expectedPassword
    ) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Dynamically import the in-memory token store (only runs on the server)
    const { issueToken, SESSION_COOKIE } = await import("@/lib/auth");
    const token = issueToken();

    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (err) {
    console.error("Auth route error:", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
