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
import {
  getPublishedCalls,
  getCallContent,
} from "./calls.functions";
import {
  adminSaveCall,
  adminPublishCall,
  adminCloseCall,
  adminArchiveCall,
} from "./admin.functions";
import type { PublicCall, StockCall } from "./types";

interface CallsContextValue {
  calls: StockCall[];
  getCall: (id: string) => StockCall | undefined;
  createCall: (call: StockCall) => void;
  updateCall: (id: string, patch: Partial<StockCall>) => void;
  closeCall: (id: string, exitPrice: number) => void;
  archiveCall: (id: string) => void;
  publishCall: (id: string) => void;
  unlocked: string[];
  unlock: (id: string) => void;
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
    series: c.series ?? [],
    confidence: c.confidence,
    checkoutHeadline: c.checkoutHeadline,
    checkoutSubtext: c.checkoutSubtext,
  };
}

function toInput(c: StockCall) {
  return {
    callNumber: c.callNumber,
    price: c.price,
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
    series: c.series,
    chartImage: c.chartImage,
    checkoutHeadline: c.checkoutHeadline ?? "",
    checkoutSubtext: c.checkoutSubtext ?? "",
  };
}

export function CallsProvider({ children }: { children: ReactNode }) {
  const fetchCalls = useServerFn(getPublishedCalls);
  const fetchContent = useServerFn(getCallContent);
  const saveCall = useServerFn(adminSaveCall);
  const publish = useServerFn(adminPublishCall);
  const close = useServerFn(adminCloseCall);
  const archive = useServerFn(adminArchiveCall);

  const [calls, setCalls] = useState<StockCall[]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const next = await fetchCalls();
    setCalls(next.map(toStockCall));
  }, [fetchCalls]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(UNLOCK_KEY);
      if (raw) setUnlocked(JSON.parse(raw) as string[]);
    } catch {}
    void refresh().catch((err) => console.error("calls refresh", err));
    const timer = window.setInterval(() => void refresh().catch((err) => console.error("calls refresh", err)), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const persistUnlock = useCallback((next: string[]) => {
    setUnlocked(next);
    try { window.localStorage.setItem(UNLOCK_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const createCall = useCallback((call: StockCall) => {
    setCalls((prev) => [call, ...prev]);
    void (async () => {
      const result = await saveCall({ data: { values: toInput(call) } });
      if (call.status === "live") await publish({ data: { callId: result.id } });
      await refresh();
    })().catch((err) => console.error("create call", err));
  }, [saveCall, publish, refresh]);

  const updateCall = useCallback((id: string, patch: Partial<StockCall>) => {
    setCalls((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
    void (async () => {
      const current = calls.find((c) => c.id === id);
      if (!current) return;
      const next = { ...current, ...patch };
      await saveCall({ data: { id, values: toInput(next) } });
      if (next.status === "live" && current.status !== "live") await publish({ data: { callId: id } });
      if (next.status === "archived" && current.status !== "archived") await archive({ data: { callId: id } });
      if (next.status === "closed" && current.status !== "closed" && next.exitPrice) await close({ data: { callId: id, exitPrice: next.exitPrice } });
      await refresh();
    })().catch((err) => console.error("update call", err));
  }, [calls, saveCall, publish, archive, close, refresh]);

  const closeCall = useCallback((id: string, exitPrice: number) => {
    setCalls((prev) => prev.map((c) => c.id === id ? { ...c, status: "closed", access: "free", price: 0, exitPrice, currentPrice: exitPrice, closedAt: new Date().toISOString().slice(0, 10) } : c));
    void close({ data: { callId: id, exitPrice } }).then(refresh).catch((err) => console.error("close call", err));
  }, [close, refresh]);

  const archiveCall = useCallback((id: string) => {
    setCalls((prev) => prev.map((c) => c.id === id ? { ...c, status: "archived", access: "free", price: 0 } : c));
    void archive({ data: { callId: id } }).then(refresh).catch((err) => console.error("archive call", err));
  }, [archive, refresh]);

  const publishCall = useCallback((id: string) => {
    void publish({ data: { callId: id } }).then(refresh).catch((err) => console.error("publish call", err));
  }, [publish, refresh]);

  const unlock = useCallback((id: string) => {
    const next = unlocked.includes(id) ? unlocked : [...unlocked, id];
    persistUnlock(next);
    void fetchContent({ data: { callId: id } }).then((full) => {
      if (full) setCalls((prev) => prev.map((c) => c.id === id ? toStockCall(full) : c));
    }).catch((err) => console.error("unlock call", err));
  }, [fetchContent, persistUnlock, unlocked]);

  const value = useMemo(() => ({
    calls, unlocked, getCall: (id: string) => calls.find((c) => c.id === id),
    createCall, updateCall, closeCall, archiveCall, publishCall, unlock,
  }), [calls, unlocked, createCall, updateCall, closeCall, archiveCall, publishCall, unlock]);

  return <CallsContext.Provider value={value}>{children}</CallsContext.Provider>;
}

export function useCalls() {
  const ctx = useContext(CallsContext);
  if (!ctx) throw new Error("useCalls must be used inside CallsProvider");
  return ctx;
}
