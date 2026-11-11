/**
 * 시세 API의 요청 해석과 응답. Route Handler(apps/web)는 이 함수를 부르고 결과를 그대로 내보낸다.
 * 시각은 서버가 정한다(클라이언트가 넘기지 않는다). 근거: docs/spec/market-data.md §3
 */
import {
  type ErrorResponse,
  HistoryRangeSchema,
  type HistoryResponse,
  HistoryResponseSchema,
  type QuotesResponse,
  QuotesResponseSchema,
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

const MAX_LISTED_IN_ERROR = 5;

function listForMessage(symbols: string[]): string {
  const shown = symbols.slice(0, MAX_LISTED_IN_ERROR).join(", ");
  const rest = symbols.length - MAX_LISTED_IN_ERROR;
  return rest > 0 ? `${shown} 외 ${rest}개` : shown;
}

/**
 * GET /api/quotes?tickers=AAPL,MSFT. `tickersParams`는 `searchParams.getAll("tickers")`.
 * 비어 있으면 고정 목록 전체. 티커는 대문자만 받는다
 */
export function quotesResponse(
  tickersParams: readonly string[],
  now: number,
): ApiResult<QuotesResponse> {
  let symbols: string[];
  if (tickersParams.length === 0) {
    symbols = TICKERS.map((ticker) => ticker.symbol);
  } else {
    symbols = [
      ...new Set(
        tickersParams
          .flatMap((param) => param.split(","))
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
        `목록에 없는 종목입니다: ${listForMessage(unknown)}`,
      );
    }
  }
  // 서버도 내보내기 전에 검증한다. NaN이 JSON에서 null로 바뀌어 나가는 일을 막는다
  return {
    status: 200,
    body: QuotesResponseSchema.parse({
      quotes: symbols.map((symbol) => quoteAt(symbol, now)),
    }),
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
    body: HistoryResponseSchema.parse({
      ticker,
      range: range.data,
      points: historyAt(ticker, range.data, now),
    }),
  };
}
