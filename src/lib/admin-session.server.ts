import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Shared-password gate for the admin desk.
 *
 * The password never reaches the browser: it lives in the server-only
 * ADMIN_PASSWORD secret, is compared inside a server function, and the
 * "unlocked" flag is kept in an encrypted httpOnly cookie.
 */
type AdminSession = { unlocked?: boolean; at?: number };

function sessionConfig() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET is not configured.");
  return {
    password,
    name: "ml-admin-desk",
    maxAge: 60 * 60 * 12, // 12 hours
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function adminSession() {
  return useSession<AdminSession>(sessionConfig());
}

/** Equal-length digest comparison so neither value nor length leaks by timing. */
export function passwordMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Throws unless the caller holds a valid unlocked admin session cookie. */
export async function requireAdminSession() {
  const session = await adminSession();
  if (!session.data.unlocked) {
    throw new Error("Admin desk is locked. Enter the desk password again.");
  }
}
