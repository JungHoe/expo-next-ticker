/**
 * 시세 API의 응답 형태. 서버는 응답을 만들 때, 클라이언트는 받을 때 같은 스키마로 검증한다.
 * Zod 4의 z.number()는 NaN·Infinity를 거부한다. 근거: docs/spec/market-data.md §3
 */
import { z } from "zod";

export const HISTORY_RANGES = ["1h", "1d", "1w", "1m"] as const;
export const HistoryRangeSchema = z.enum(HISTORY_RANGES);
export type HistoryRange = z.infer<typeof HistoryRangeSchema>;

export const QuoteSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  price: z.number(),
  /** 오늘 0시(KST) 가격 */
  base: z.number(),
  change: z.number(),
  changePct: z.number(),
  high: z.number(),
  low: z.number(),
  /** 초 단위로 내린 시각(epoch ms) */
  asOf: z.number().int(),
});
export type Quote = z.infer<typeof QuoteSchema>;

// 빈 목록은 오류다(watchlist.md §4). 고정 목록이라 정상 응답은 항상 1종목 이상이다
export const QuotesResponseSchema = z.object({
  quotes: z.array(QuoteSchema).min(1),
});
export type QuotesResponse = z.infer<typeof QuotesResponseSchema>;

export const HistoryPointSchema = z.object({
  t: z.number().int(),
  p: z.number(),
});
export type HistoryPoint = z.infer<typeof HistoryPointSchema>;

export const HistoryResponseSchema = z.object({
  ticker: z.string(),
  range: HistoryRangeSchema,
  points: z.array(HistoryPointSchema),
});
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;

export const ERROR_CODES = [
  "UNKNOWN_TICKER",
  "INVALID_TICKERS",
  "INVALID_RANGE",
] as const;
export const ErrorResponseSchema = z.object({
  error: z.object({ code: z.enum(ERROR_CODES), message: z.string() }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
