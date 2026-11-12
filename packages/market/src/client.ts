/**
 * 시세 API 클라이언트. 패키지는 DOM·React Native 타입 없이 컴파일하므로 fetch를 주입받는다
 * (웹·앱은 각자의 전역 fetch를 넘긴다). 응답은 서버와 같은 스키마로 검증한다.
 */
import type { z } from "zod";
import {
  ErrorResponseSchema,
  type HistoryRange,
  HistoryResponseSchema,
  QuotesResponseSchema,
} from "./schema";

export type ResponseLike = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export interface MarketApiConfig {
  /** 웹은 "" (같은 출처), 앱은 배포된 웹 주소 */
  baseUrl: string;
  fetch(url: string, init?: { signal?: unknown }): Promise<ResponseLike>;
}

export class MarketApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MarketApiError";
  }
}

async function getJson<T>(
  config: MarketApiConfig,
  path: string,
  schema: z.ZodType<T>,
  signal?: unknown,
): Promise<T> {
  const res = await config.fetch(`${config.baseUrl}${path}`, { signal });
  if (!res.ok) {
    // 우리 API가 아닌 곳(예: CDN의 HTML 오류 페이지)에서 온 응답일 수도 있다
    const parsed = ErrorResponseSchema.safeParse(
      await res.json().catch(() => undefined),
    );
    throw parsed.success
      ? new MarketApiError(
          res.status,
          parsed.data.error.code,
          parsed.data.error.message,
        )
      : new MarketApiError(res.status, "HTTP_ERROR", `HTTP ${res.status}`);
  }
  return schema.parse(await res.json());
}

export function fetchQuotes(config: MarketApiConfig, signal?: unknown) {
  return getJson(config, "/api/quotes", QuotesResponseSchema, signal);
}

export function fetchHistory(
  config: MarketApiConfig,
  ticker: string,
  range: HistoryRange,
  signal?: unknown,
) {
  return getJson(
    config,
    `/api/quotes/${encodeURIComponent(ticker)}/history?range=${range}`,
    HistoryResponseSchema,
    signal,
  );
}
