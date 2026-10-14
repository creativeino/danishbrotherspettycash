import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Default Owner/Admin credentials
    const ADMIN_USER = process.env.ADMIN_USERNAME || "admin@danibrothers.com";
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || "danibro123";

    if (username.trim().toLowerCase() === ADMIN_USER.toLowerCase() && password === ADMIN_PASS) {
      const response = NextResponse.json({ success: true, user: { username: "admin@danibrothers.com", role: "Owner" } });
      
      // Set secure cookie
      response.cookies.set("danibro_auth", "true", {
        httpOnly: false, // accessible for quick client state sync
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
