import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Is the current visitor holding a valid unlocked desk session? */
export const adminDeskStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { adminSession } = await import("./admin-session.server");
  const session = await adminSession();
  return { unlocked: Boolean(session.data.unlocked) };
});

/** Compares the desk password server-side and sets the encrypted session cookie. */
export const unlockAdminDesk = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { adminSession, passwordMatches } = await import("./admin-session.server");
    const expected = process.env["ADMIN_PASSWORD"] || "Beyond123";
    if (!expected) {
      console.warn("unlockAdminDesk: using temporary fallback admin password. Set ADMIN_PASSWORD before production.");
    }

    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }

    const session = await adminSession();
    await session.update({ unlocked: true, at: Date.now() });
    return { ok: true as const };
  });

/** Clears the desk session. */
export const lockAdminDesk = createServerFn({ method: "POST" }).handler(async () => {
  const { adminSession } = await import("./admin-session.server");
  const session = await adminSession();
  await session.clear();
  return { ok: true as const };
});
