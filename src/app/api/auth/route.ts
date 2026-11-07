import { NextResponse } from "next/server";
import { USERS_CONFIG, getSessionUserFromCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const user = getSessionUserFromCookie(cookieHeader);

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const cleanUser = username.trim().toLowerCase();
    const config = USERS_CONFIG[cleanUser];

    if (!config) {
      return NextResponse.json(
        { error: "Invalid username. Allowed users: danish, wahab, subhan" },
        { status: 401 }
      );
    }

    // Verify password if configured
    if (config.password && password !== config.password) {
      return NextResponse.json({ error: "Invalid password for user" }, { status: 401 });
    }

    const authUser = {
      username: cleanUser,
      name: config.name,
      role: config.role,
    };

    const response = NextResponse.json({
      success: true,
      user: authUser,
    });

    const cookiePayload = encodeURIComponent(JSON.stringify(authUser));

    // Set auth cookie
    response.cookies.set("danibro_auth", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Set user metadata cookie
    response.cookies.set("danibro_user", cookiePayload, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("danibro_auth");
  response.cookies.delete("danibro_user");
  return response;
}
