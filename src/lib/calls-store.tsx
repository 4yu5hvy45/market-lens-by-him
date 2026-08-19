import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { useLocation } from "@tanstack/react-router";
import { getPublishedCalls, getCallContent } from "./calls.functions";
import {
  adminListCalls,
  adminSaveCall,
  adminPublishCall,
  adminRelistCall,
  adminCloseCall,
  adminArchiveCall,
  adminDuplicateCall,
  adminDeleteCall,
} from "./admin.functions";
import type { FullCall, PublicCall, StockCall } from "./types";
import { normalizeSeries } from "./series";

interface CallsContextValue {
  calls: StockCall[];
  getCall: (id: string) => StockCall | undefined;
  refreshAdmin: () => Promise<void>;
  createCall: (call: StockCall) => Promise<void>;
  updateCall: (id: string, patch: Partial<StockCall>) => Promise<void>;
  closeCall: (id: string, exitPrice: number) => Promise<void>;
  archiveCall: (id: string) => Promise<void>;
  publishCall: (id: string) => Promise<void>;
  duplicateCall: (id: string) => Promise<{ id: string; callNumber: number }>;
  relistCall: (id: string) => Promise<void>;
  deleteCall: (id: string) => Promise<void>;
  unlock: (id: string, accessToken?: string) => Promise<FullCall | PublicCall | null>;
  unlocked: string[];
}

const CallsContext = createContext<CallsContextValue | null>(null);
const UNLOCK_KEY = "ml.unlocked.v2";

function toStockCall(c: PublicCall): StockCall {
  return {
    id: c.id,
    callNumber: c.callNumber,
    chartImage: c.chartImage,
    stock: c.stock ?? "",
    ticker: c.ticker ?? "",
    exchange: c.exchange ?? "",
    sector: c.sector,
    direction: c.direction,
    status: c.state === "draft" ? "live" : c.state,
    access: c.locked ? "paid" : "free",
    price: c.price,
    currentPrice: c.currentPrice ?? 0,
    entry: c.entry ?? 0,
    target: c.target ?? 0,
    stopLoss: c.stopLoss ?? 0,
    term: c.term as StockCall["term"],
    coverage: c.coverage,
    segment: c.segment,
    timeframe: c.timeframe,
    changePct: c.changePct ?? 0,
    view: c.view ?? "",
    publishedAt: c.publishedAt ?? new Date().toISOString().slice(0, 10),
    closedAt: c.closedAt ?? undefined,
    exitPrice: c.exitPrice,
    summary: c.summary ?? "",
    research: c.research ?? [],
    catalysts: c.catalysts ?? [],
    series: normalizeSeries(c.series),
    confidence: c.confidence,
    potentialPctDisplay: c.potentialPct,
    riskPctDisplay: c.riskPct,
    potentialPctOverride: c.potentialPctOverride,
    checkoutHeadline: c.checkoutHeadline,
    checkoutSubtext: c.checkoutSubtext,
  };
}

function toAdminStockCall(c: FullCall): StockCall {
  return {
    ...toStockCall(c),
    status: c.state,
    access: c.price > 0 ? "paid" : "free",
    checkoutHeadline: c.checkoutHeadline,
    checkoutSubtext: c.checkoutSubtext,
  };
}

function toInput(c: StockCall) {
  return {
    callNumber: c.callNumber,
    state: c.status,
    price: c.access === "free" ? 0 : c.price,
    stock: c.stock,
    ticker: c.ticker,
    exchange: c.exchange,
    sector: c.sector,
    direction: c.direction,
    entry: c.entry,
    target: c.target,
    stopLoss: c.stopLoss,
    currentPrice: c.currentPrice,
    term: c.term,
    coverage: c.coverage,
    segment: c.segment,
    timeframe: c.timeframe,
    changePct: c.changePct,
    confidence: c.confidence,
    summary: c.summary,
    view: c.view,
    research: c.research,
    catalysts: c.catalysts,
    series: normalizeSeries(c.series),
    chartImage: c.chartImage,
    potentialPctOverride: c.potentialPctOverride,
    checkoutHeadline: c.checkoutHeadline ?? "",
    checkoutSubtext: c.checkoutSubtext ?? "",
  };
}

export function CallsProvider({ children }: { children: ReactNode }) {
  const fetchCalls = useServerFn(getPublishedCalls);
  const fetchContent = useServerFn(getCallContent);
  const fetchAdminCalls = useServerFn(adminListCalls);
  const saveCall = useServerFn(adminSaveCall);
  const publish = useServerFn(adminPublishCall);
  const relist = useServerFn(adminRelistCall);
  const close = useServerFn(adminCloseCall);
  const archive = useServerFn(adminArchiveCall);
  const duplicate = useServerFn(adminDuplicateCall);
  const deleteCallFn = useServerFn(adminDeleteCall);

  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [calls, setCalls] = useState<StockCall[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const refreshPublic = useCallback(async () => {
    const next = await fetchCalls();
    setCalls(next.map(toStockCall));
  }, [fetchCalls]);

  const refreshAdmin = useCallback(async () => {
    const next = await fetchAdminCalls();
    setCalls(next.map(toAdminStockCall));
  }, [fetchAdminCalls]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(UNLOCK_KEY);
      if (raw) setUnlocked(JSON.parse(raw) as string[]);
    } catch {}

    if (isAdminRoute) return;

    void refreshPublic().catch((err) => console.error("calls refresh", err));
    const timer = window.setInterval(
      () => void refreshPublic().catch((err) => console.error("calls refresh", err)),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, [refreshPublic, isAdminRoute]);

  const persistUnlock = useCallback((next: string[]) => {
    setUnlocked(next);
    try { window.localStorage.setItem(UNLOCK_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const createCall = useCallback(async (call: StockCall) => {
    const result = await saveCall({ data: { values: toInput(call) } });
    if (call.status === "live") await publish({ data: { callId: result.id } });
    await refreshAdmin();
  }, [saveCall, publish, refreshAdmin]);

  const updateCall = useCallback(async (id: string, patch: Partial<StockCall>) => {
    const current = calls.find((c) => c.id === id);
    if (!current) throw new Error("Call is no longer loaded. Refresh the Admin desk and try again.");
    const next = { ...current, ...patch };
    await saveCall({ data: { id, values: toInput(next) } });

    if (next.status === "live" && current.status !== "live") {
      await relist({ data: { callId: id } });
    } else if (next.status === "archived" && current.status !== "archived") {
      await archive({ data: { callId: id } });
    } else if (next.status === "closed" && current.status !== "closed") {
      if (!next.exitPrice || next.exitPrice <= 0) throw new Error("Enter an exit price before closing the call.");
      await close({ data: { callId: id, exitPrice: next.exitPrice } });
    }
    await refreshAdmin();
  }, [calls, saveCall, relist, archive, close, refreshAdmin]);

  const closeCall = useCallback(async (id: string, exitPrice: number) => {
    if (!exitPrice || exitPrice <= 0) throw new Error("Enter a valid exit price.");
    await close({ data: { callId: id, exitPrice } });
    await refreshAdmin();
  }, [close, refreshAdmin]);

  const archiveCall = useCallback(async (id: string) => {
    await archive({ data: { callId: id } });
    await refreshAdmin();
  }, [archive, refreshAdmin]);

  const publishCall = useCallback(async (id: string) => {
    await publish({ data: { callId: id } });
    await refreshAdmin();
  }, [publish, refreshAdmin]);

  const relistCall = useCallback(async (id: string) => {
    await relist({ data: { callId: id } });
    await refreshAdmin();
  }, [relist, refreshAdmin]);

  const deleteCall = useCallback(async (id: string) => {
    await deleteCallFn({ data: { callId: id } });
    await refreshAdmin();
  }, [deleteCallFn, refreshAdmin]);

  const duplicateCall = useCallback(async (id: string) => {
    const result = await duplicate({ data: { callId: id } });
    await refreshAdmin();
    return result;
  }, [duplicate, refreshAdmin]);

  const unlock = useCallback(async (id: string, accessToken?: string) => {
    // Do not mark the call unlocked or navigate until the server has returned
    // the paid sheet. Passing the verified token directly avoids a race between
    // the payment response, the customer session cookie, and the call fetch.
    const full = await fetchContent({ data: { callId: id, accessToken } });
    if (!full) throw new Error("Payment was verified, but the full call could not be loaded. Please try opening the call again.");
    setCalls((prev) => prev.map((c) => c.id === id ? toStockCall(full) : c));
    const next = unlocked.includes(id) ? unlocked : [...unlocked, id];
    persistUnlock(next);
    return full;
  }, [fetchContent, persistUnlock, unlocked]);

  const value = useMemo(() => ({
    calls,
    unlocked,
    getCall: (id: string) => calls.find((c) => c.id === id),
    refreshAdmin,
    createCall,
    updateCall,
    closeCall,
    archiveCall,
    publishCall,
    relistCall,
    deleteCall,
    duplicateCall,
    unlock,
  }), [calls, unlocked, refreshAdmin, createCall, updateCall, closeCall, archiveCall, publishCall, relistCall, deleteCall, duplicateCall, unlock]);

  return <CallsContext.Provider value={value}>{children}</CallsContext.Provider>;
}

export function useCalls() {
  const ctx = useContext(CallsContext);
  if (!ctx) throw new Error("useCalls must be used inside CallsProvider");
  return ctx;
}
