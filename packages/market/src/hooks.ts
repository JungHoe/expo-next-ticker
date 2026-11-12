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
} from "react";
import type { MarketApiConfig } from "./client";
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
