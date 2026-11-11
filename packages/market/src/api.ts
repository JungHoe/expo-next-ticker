/**
 * 시세 API의 요청 해석과 응답. Route Handler(apps/web)는 이 함수를 부르고 결과를 그대로 내보낸다.
 * 시각은 서버가 정한다(클라이언트가 넘기지 않는다). 근거: docs/spec/market-data.md §3
 */
import {
  type ErrorResponse,
  HistoryRangeSchema,
  type HistoryResponse,
  type QuotesResponse,
} from "./schema";
import { historyAt, quoteAt } from "./simulation";
import { findTicker, TICKERS } from "./tickers";

export type ApiResult<T> =
  | { status: 200; body: T }
  | { status: 400 | 404; body: ErrorResponse };

function failure(
  status: 400 | 404,
  code: ErrorResponse["error"]["code"],
  message: string,
): ApiResult<never> {
  return { status, body: { error: { code, message } } };
}

/** GET /api/quotes?tickers=AAPL,MSFT. tickers가 없으면 고정 목록 전체 */
export function quotesResponse(
  tickersParam: string | null,
  now: number,
): ApiResult<QuotesResponse> {
  let symbols: string[];
  if (tickersParam === null) {
    symbols = TICKERS.map((ticker) => ticker.symbol);
  } else {
    symbols = [
      ...new Set(
        tickersParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
    if (symbols.length === 0) {
      return failure(400, "INVALID_TICKERS", "tickers가 비어 있습니다");
    }
    const unknown = symbols.filter((symbol) => !findTicker(symbol));
    if (unknown.length > 0) {
      return failure(
        404,
        "UNKNOWN_TICKER",
        `목록에 없는 종목입니다: ${unknown.join(", ")}`,
      );
    }
  }
  return {
    status: 200,
    body: { quotes: symbols.map((symbol) => quoteAt(symbol, now)) },
  };
}

/** GET /api/quotes/{ticker}/history?range=1h|1d|1w|1m */
export function historyResponse(
  ticker: string,
  rangeParam: string | null,
  now: number,
): ApiResult<HistoryResponse> {
  if (!findTicker(ticker)) {
    return failure(404, "UNKNOWN_TICKER", `목록에 없는 종목입니다: ${ticker}`);
  }
  const range = HistoryRangeSchema.safeParse(rangeParam);
  if (!range.success) {
    return failure(
      400,
      "INVALID_RANGE",
      "range는 1h, 1d, 1w, 1m 중 하나입니다",
    );
  }
  return {
    status: 200,
    body: {
      ticker,
      range: range.data,
      points: historyAt(ticker, range.data, now),
    },
  };
}
