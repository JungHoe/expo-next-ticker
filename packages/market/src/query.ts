/**
 * TanStack Query 조회 설정. 훅(hooks.ts)은 이 설정을 그대로 쓰고, 테스트는 React 없이 이 설정을 검증한다.
 * 근거: docs/spec/market-data.md §3(스키마와 훅), §4
 */
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { fetchHistory, fetchQuotes, type MarketApiConfig } from "./client";
import type { HistoryPoint, HistoryRange, Quote } from "./schema";
import { HISTORY_SHAPE } from "./simulation";

export const QUOTES_REFETCH_MS = 1_000;

/** 전체 목록 하나. 목록과 상세가 같은 키를 써서 화면이 몇 개든 초당 요청은 1회다 */
export function quotesQueryOptions(config: MarketApiConfig) {
  return queryOptions({
    queryKey: ["market", "quotes"] as const,
    queryFn: ({ signal }) => fetchQuotes(config, signal),
    refetchInterval: QUOTES_REFETCH_MS,
    // 웹: 탭이 보이지 않으면, 앱: focusManager를 AppState에 연결해 백그라운드면 멈춘다
    refetchIntervalInBackground: false,
  });
}

/** 기간 간격마다 다시 받고, 기간을 바꾸는 동안 이전 차트를 유지한다(stock-detail.md §4) */
export function historyQueryOptions(
  config: MarketApiConfig,
  ticker: string,
  range: HistoryRange,
) {
  return queryOptions({
    queryKey: ["market", "history", ticker, range] as const,
    queryFn: ({ signal }) => fetchHistory(config, ticker, range, signal),
    refetchInterval: HISTORY_SHAPE[range].step,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  });
}

/** 1시간 차트에 폴링한 최신 시세를 마지막 점으로 이어 붙인다 */
export function withLivePoint(
  points: HistoryPoint[],
  quote: Quote | undefined,
): HistoryPoint[] {
  const last = points.at(-1);
  if (!quote || (last && quote.asOf <= last.t)) return points;
  return [...points, { t: quote.asOf, p: quote.price }];
}
