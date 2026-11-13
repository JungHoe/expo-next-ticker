/**
 * TanStack Query 조회 설정. 훅(hooks.ts)은 이 설정을 그대로 쓰고, 테스트는 React 없이 이 설정을 검증한다.
 * 근거: docs/spec/market-data.md §3(스키마와 훅), §4
 */
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import {
  fetchHistory,
  fetchQuotes,
  type MarketApiConfig,
  MarketApiError,
} from "./client";
import type { HistoryPoint, HistoryRange, Quote } from "./schema";
import { HISTORY_SHAPE } from "./simulation";

export const QUOTES_REFETCH_MS = 1_000;
/** 초 경계에서 이만큼 뒤에 요청한다. 기기 시계가 이 안에서 맞으면 모두 같은 초의 시세를 받는다 */
const TICK_PHASE_MS = 150;

/**
 * 다음 "초 경계 + 150ms"까지 남은 시간(0 < 값 ≤ 1000).
 * 고정 1초 간격이면 클라이언트마다 박자가 달라 한 순간에 서로 다른 초의 가격을 본다(#16에서 계측)
 */
export function msUntilNextTick(now: number): number {
  const wait = QUOTES_REFETCH_MS - (now % QUOTES_REFETCH_MS) + TICK_PHASE_MS;
  return wait > QUOTES_REFETCH_MS ? wait - QUOTES_REFETCH_MS : wait;
}

/**
 * 전체 목록 하나. 목록과 상세가 같은 키를 쓴다. 화면마다 폴링 타이머가 있어도 TanStack이 데이터가
 * 갱신될 때마다 모든 타이머를 다시 맞추므로 요청은 한 박자로 모인다(#12에서 지연·시차 조건으로 확인).
 */
export function quotesQueryOptions(config: MarketApiConfig) {
  return queryOptions({
    queryKey: ["market", "quotes"] as const,
    queryFn: ({ signal }) => fetchQuotes(config, signal),
    // 시계에 맞춘 박자. TanStack은 응답(성공·실패)이 올 때마다 이 함수로 다음 간격을 다시 잡으므로
    // 마지막 응답 시각이 곧 지금이다. Date.now()를 쓰지 않는다: 렌더 중에도 불려 Next.js Cache
    // Components 빌드가 막는다(#16 빌드에서 확인). 첫 응답 전(0)에는 첫 요청이 진행 중이라 겹치지 않는다
    refetchInterval: (query) =>
      msUntilNextTick(
        Math.max(query.state.dataUpdatedAt, query.state.errorUpdatedAt),
      ),
    // 웹: 탭이 보이지 않으면, 앱: focusManager를 AppState에 연결해 백그라운드면 멈춘다
    refetchIntervalInBackground: false,
    // 1초 안에 연 화면은 새로 받지 않는다(상세 진입 때 추가 요청 방지)
    staleTime: QUOTES_REFETCH_MS,
    // 다음 폴링이 곧 재시도다. 재시도 백오프가 있으면 오류 표시가 늦어진다
    retry: false,
  });
}

const HISTORY_MAX_RETRIES = 2;

/** 확정 오류(4xx, 응답 형태 오류)는 다시 받아도 같으므로 재시도하지 않는다 */
function shouldRetryHistory(failureCount: number, error: unknown): boolean {
  if (error instanceof MarketApiError && error.status < 500) return false;
  if (error instanceof z.ZodError) return false;
  return failureCount < HISTORY_MAX_RETRIES;
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
    retry: shouldRetryHistory,
    retryDelay: 1_000,
    // 기간을 바꾸는 동안 같은 종목의 이전 차트만 유지한다. 다른 종목 차트에 새 시세를 잇지 않는다
    placeholderData: (previous) =>
      previous?.ticker === ticker ? previous : undefined,
  });
}

/** 1시간 차트에 폴링한 최신 시세를 마지막 점으로 이어 붙인다 */
export function withLivePoint(
  points: HistoryPoint[],
  quote: Quote | undefined,
): HistoryPoint[] {
  const last = points.at(-1);
  // 이력이 오기 전에는 붙이지 않는다. 점 하나만 먼저 그려졌다가 선으로 바뀌는 깜빡임을 막는다(#15 리뷰)
  if (!quote || !last || quote.asOf <= last.t) return points;
  return [...points, { t: quote.asOf, p: quote.price }];
}
