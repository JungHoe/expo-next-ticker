/**
 * 웹·앱이 같이 쓰는 시세 훅. React만 쓰고 DOM·React Native API는 쓰지 않는다.
 * 앱마다 QueryClientProvider 안에 MarketApiProvider를 둔다.
 */
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { MarketApiConfig } from "./client";
import { secondsSince } from "./format";
import { historyQueryOptions, quotesQueryOptions } from "./query";
import type { HistoryRange } from "./schema";

const MarketApiContext = createContext<MarketApiConfig | null>(null);

export function MarketApiProvider({
  config,
  children,
}: {
  config: MarketApiConfig;
  children?: ReactNode;
}) {
  return createElement(MarketApiContext.Provider, { value: config }, children);
}

function useMarketApi(): MarketApiConfig {
  const config = useContext(MarketApiContext);
  if (!config) throw new Error("MarketApiProvider 안에서 써야 합니다");
  return config;
}

export function useQuotes() {
  return useQuery(quotesQueryOptions(useMarketApi()));
}

/** useQuotes와 같은 요청을 쓰고 한 종목만 고른다 */
export function useQuote(ticker: string) {
  return useQuery({
    ...quotesQueryOptions(useMarketApi()),
    select: (data) => data.quotes.find((quote) => quote.ticker === ticker),
  });
}

export function useHistory(ticker: string, range: HistoryRange) {
  return useQuery(historyQueryOptions(useMarketApi(), ticker, range));
}

/** 패키지는 DOM·Node 타입 없이 검사하므로 타이머를 타입과 함께 꺼낸다(웹·RN 모두 전역에 있다) */
const timers = globalThis as unknown as {
  setInterval(callback: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
};

/**
 * 시세가 있다가 끊겼는지(오류·오프라인)와 마지막으로 받은 뒤 지난 초.
 * 웹·앱의 "N초 전 시세"가 같은 기준을 쓴다(watchlist.md §4). 끊긴 동안만 1초마다 다시 그린다.
 * 렌더 중에 Date.now()를 읽지 않는다(Next.js Cache Components가 미리 렌더링할 때 막는다)
 */
export function useQuoteFreshness(): {
  stale: boolean;
  secondsAgo: number | null;
} {
  const { data, isError, fetchStatus, dataUpdatedAt } = useQuotes();
  const stale = Boolean(data) && (isError || fetchStatus === "paused");
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!stale) {
      setNow(null);
      return;
    }
    setNow(Date.now());
    const id = timers.setInterval(() => setNow(Date.now()), 1_000);
    return () => timers.clearInterval(id);
  }, [stale]);
  return {
    stale,
    secondsAgo: stale && now !== null ? secondsSince(dataUpdatedAt, now) : null,
  };
}
