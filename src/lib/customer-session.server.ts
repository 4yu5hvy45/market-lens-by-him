import { useSession } from "@tanstack/react-start/server";

type CustomerAccess = { calls?: Record<string, string> };

export async function customerSession() {
  const password = process.env["SESSION_SECRET"];
  if (!password) throw new Error("SESSION_SECRET is not configured.");

  return useSession<CustomerAccess>({
    password,
    name: "ml-customer-access",
    maxAge: 60 * 60 * 24 * 365,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
    },
  });
}

export async function grantCallAccess(callId: string, accessToken: string) {
  const session = await customerSession();
  const calls = { ...(session.data.calls ?? {}), [callId]: accessToken };
  await session.update({ calls });
}

export async function customerHasAccess(callId: string) {
  const session = await customerSession();
  return Boolean(session.data.calls?.[callId]);
}

export async function customerAccessToken(callId: string) {
  const session = await customerSession();
  return session.data.calls?.[callId] ?? null;
}
