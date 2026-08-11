import { useEffect, useState, type ReactNode } from "react";
import { KeyRound, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { BrandLogo } from "./brand-logo";
import { adminDeskStatus, unlockAdminDesk, lockAdminDesk } from "@/lib/admin-auth.functions";

/**
 * Shared-password gate for the desk. The password is checked on the server and
 * the unlocked flag lives in an encrypted httpOnly cookie, so nothing secret
 * ships to the browser and every admin action re-verifies the session.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const status = useServerFn(adminDeskStatus);
  const unlock = useServerFn(unlockAdminDesk);

  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    status()
      .then((r) => {
        if (active) setOk(r.unlocked);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [status]);

  if (!ready) return null;

  if (!ok) {
    return (
      <div className="hero-navy flex min-h-screen items-center justify-center px-4">
        <div className="glass relative z-10 w-full max-w-sm rounded-3xl p-7">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <div className="mt-7 flex items-center gap-3">
            <span className="lock-orb grid h-11 w-11 place-items-center rounded-2xl">
              <Lock className="h-5 w-5 text-navy" strokeWidth={1.9} />
            </span>
            <div>
              <h1 className="font-display text-lg font-extrabold">Admin access</h1>
              <p className="text-[11px] text-muted-foreground">Desk control is password protected</p>
            </div>
          </div>

          <form
            className="mt-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const res = await unlock({ data: { password: value } });
                if (res.ok) setOk(true);
                else setError("Incorrect password.");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not verify the password.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                autoFocus
                autoComplete="current-password"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </label>
            {error && <p className="mt-2 text-xs font-medium text-bear">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-blue sheen mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" /> {busy ? "Checking…" : "Enter desk"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export async function adminSignOut() {
  try {
    await lockAdminDesk();
  } finally {
    window.location.href = "/";
  }
}
