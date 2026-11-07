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
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/danibro_user=([^;]+)/);
  if (!match) return null;

  try {
    const raw = decodeURIComponent(match[1]);
    const parsed = JSON.parse(raw);
    if (parsed && parsed.username && parsed.role) {
      return {
        username: parsed.username.toLowerCase(),
        name: parsed.name || parsed.username,
        role: parsed.role === "ADMIN" ? "ADMIN" : "OPERATOR",
      };
    }
  } catch (err) {
    console.error("Failed to parse danibro_user cookie:", err);
  }
  return null;
}
