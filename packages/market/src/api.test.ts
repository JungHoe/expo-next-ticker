import { describe, expect, test } from "vitest";
import { historyResponse, quotesResponse } from "./api";
import {
  ErrorResponseSchema,
  HistoryResponseSchema,
  QuotesResponseSchema,
} from "./schema";
import { quoteAt } from "./simulation";

// 2026-11-08 00:30:00 KST
const NOW = Date.UTC(2026, 10, 7, 15, 30, 0);

describe("quotesResponse (GET /api/quotes)", () => {
  test("tickers가 없으면 고정 10종목을 순서대로 준다", () => {
    const res = quotesResponse(null, NOW);
    expect(res.status).toBe(200);
    const body = QuotesResponseSchema.parse(res.body);
    expect(body.quotes.map((q) => q.ticker)).toEqual([
      "AAPL",
      "MSFT",
      "NVDA",
      "AMZN",
      "GOOGL",
      "META",
      "TSLA",
      "AVGO",
      "JPM",
      "V",
    ]);
    expect(body.quotes[0]).toEqual(quoteAt("AAPL", NOW));
  });

  test("tickers를 주면 요청한 순서로, 중복 없이 준다", () => {
    const res = quotesResponse("TSLA,AAPL,TSLA", NOW);
    const body = QuotesResponseSchema.parse(res.body);
    expect(body.quotes.map((q) => q.ticker)).toEqual(["TSLA", "AAPL"]);
  });

  test("목록에 없는 티커가 있으면 404와 정해진 오류 형태", () => {
    const res = quotesResponse("AAPL,ZZZZ", NOW);
    expect(res.status).toBe(404);
    const body = ErrorResponseSchema.parse(res.body);
    expect(body.error.code).toBe("UNKNOWN_TICKER");
    expect(body.error.message).toContain("ZZZZ");
  });

  test("tickers가 비어 있으면 400", () => {
    const res = quotesResponse("", NOW);
    expect(res.status).toBe(400);
    expect(ErrorResponseSchema.parse(res.body).error.code).toBe(
      "INVALID_TICKERS",
    );
  });
});

describe("historyResponse (GET /api/quotes/{ticker}/history)", () => {
  test("기간별 점을 준다", () => {
    const res = historyResponse("AAPL", "1d", NOW);
    expect(res.status).toBe(200);
    const body = HistoryResponseSchema.parse(res.body);
    expect(body).toMatchObject({ ticker: "AAPL", range: "1d" });
    expect(body.points).toHaveLength(145);
  });

  test("목록에 없는 티커는 404", () => {
    const res = historyResponse("ZZZZ", "1h", NOW);
    expect(res.status).toBe(404);
    expect(ErrorResponseSchema.parse(res.body).error.code).toBe(
      "UNKNOWN_TICKER",
    );
  });

  test.each([["2y"], [""], [null]])("기간이 %s면 400", (range) => {
    const res = historyResponse("AAPL", range, NOW);
    expect(res.status).toBe(400);
    expect(ErrorResponseSchema.parse(res.body).error.code).toBe(
      "INVALID_RANGE",
    );
  });
});

describe("스키마", () => {
  test("숫자가 아닌 가격, 빠진 필드는 거부한다", () => {
    const quote = quoteAt("AAPL", NOW);
    expect(
      QuotesResponseSchema.safeParse({ quotes: [{ ...quote, price: "1" }] })
        .success,
    ).toBe(false);
    const { high: _high, ...withoutHigh } = quote;
    expect(
      QuotesResponseSchema.safeParse({ quotes: [withoutHigh] }).success,
    ).toBe(false);
  });

  test("NaN·Infinity 가격은 거부한다", () => {
    const quote = quoteAt("AAPL", NOW);
    for (const price of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(
        QuotesResponseSchema.safeParse({ quotes: [{ ...quote, price }] })
          .success,
      ).toBe(false);
    }
  });
});
