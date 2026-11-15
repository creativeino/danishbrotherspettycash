export interface AuthUser {
  username: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
}

export const USERS_CONFIG: Record<string, { name: string; role: "ADMIN" | "OPERATOR"; password?: string }> = {
  danish: {
    name: "Danish",
    role: "ADMIN",
    password: process.env.ADMIN_PASSWORD || "danibro123",
  },
  admin: {
    name: "Danish (Admin)",
    role: "ADMIN",
    password: process.env.ADMIN_PASSWORD || "danibro123",
  },
  "admin@danibrothers.com": {
    name: "Danish (Owner)",
    role: "ADMIN",
    password: process.env.ADMIN_PASSWORD || "danibro123",
  },
  wahab: {
    name: "Wahab",
    role: "OPERATOR",
    password: process.env.WAHAB_PASSWORD || "wahab123",
  },
  subhan: {
    name: "Subhan",
    role: "OPERATOR",
    password: process.env.SUBHAN_PASSWORD || "subhan123",
  },
};

export function getSessionUserFromCookie(cookieHeader: string | null): AuthUser | null {
  if (!cookieHeader) {
    // Graceful fallback to Admin for local/internal petty cash system
    return {
      username: "danish",
      name: "Danish (Admin)",
      role: "ADMIN",
    };
  }

  const match = cookieHeader.match(/danibro_user=([^;]+)/);
  if (!match) {
    // If danibro_auth cookie or other cookie exists without danibro_user, default to Admin
    return {
      username: "danish",
      name: "Danish (Admin)",
      role: "ADMIN",
    };
  }

  try {
    const raw = decodeURIComponent(match[1]);
    const parsed = JSON.parse(raw);
    if (parsed && parsed.username) {
      const u = parsed.username.toLowerCase();
      const isAdmin = parsed.role === "ADMIN" || u === "danish" || u === "admin" || u.includes("admin");
      return {
        username: u,
        name: parsed.name || parsed.username,
        role: isAdmin ? "ADMIN" : "OPERATOR",
      };
    }
  } catch (err) {
    console.error("Failed to parse danibro_user cookie:", err);
  }

  return {
    username: "danish",
    name: "Danish (Admin)",
    role: "ADMIN",
  };
}
