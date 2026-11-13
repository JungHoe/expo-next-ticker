// 훅은 브라우저·RN에서 돈다. TanStack Query는 window가 없으면 서버로 보고 refetchInterval을 끄므로
// 이 파일은 브라우저 환경에서 돌린다
// @vitest-environment happy-dom
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { historyResponse, quotesResponse } from "./api";
import {
  fetchHistory,
  fetchQuotes,
  type MarketApiConfig,
  MarketApiError,
} from "./client";
import {
  historyQueryOptions,
  quotesQueryOptions,
  withLivePoint,
} from "./query";
import { quoteAt } from "./simulation";

const NOW = Date.UTC(2026, 10, 7, 15, 30, 0);

/**
 * 패키지는 DOM·Node 타입 없이 검사하므로 setTimeout을 타입과 함께 꺼낸다.
 * 부를 때마다 읽어야 vi.useFakeTimers()가 바꿔 넣은 가짜 타이머를 쓴다
 */
const later = (callback: () => void, ms: number) =>
  (
    globalThis as unknown as {
      setTimeout: (callback: () => void, ms: number) => unknown;
    }
  ).setTimeout(callback, ms);

/** 우리 API 함수로 응답하는 가짜 fetch. 호출한 URL을 기록한다 */
function fakeApi(now = () => NOW) {
  const urls: string[] = [];
  const config: MarketApiConfig = {
    baseUrl: "https://example.test",
    async fetch(url) {
      urls.push(url);
      // 패키지는 DOM·Node 타입 없이 검사하므로 URL 대신 직접 나눈다
      const [pathname = "", query = ""] = url
        .slice(config.baseUrl.length)
        .split("?");
      const params = query
        .split("&")
        .filter(Boolean)
        .map((pair) => pair.split("=").map(decodeURIComponent));
      const values = (key: string) =>
        params.filter(([k]) => k === key).map(([, v]) => v ?? "");
      const history = /^\/api\/quotes\/([^/]+)\/history$/.exec(pathname);
      const result = history
        ? historyResponse(history[1] ?? "", values("range")[0] ?? null, now())
        : quotesResponse(values("tickers"), now());
      return {
        ok: result.status === 200,
        status: result.status,
        json: async () => result.body,
      };
    },
  };
  return { config, urls };
}

describe("fetchQuotes / fetchHistory", () => {
  test("응답을 스키마로 검증해 돌려준다", async () => {
    const { config, urls } = fakeApi();
    const body = await fetchQuotes(config);
    expect(urls).toEqual(["https://example.test/api/quotes"]);
    expect(body.quotes).toHaveLength(10);
    const history = await fetchHistory(config, "AAPL", "1w");
    expect(history.points).toHaveLength(169);
  });

  test("오류 응답은 상태·코드를 담은 MarketApiError로 던진다", async () => {
    const { config } = fakeApi();
    const error = await fetchHistory(config, "ZZZZ", "1h").catch((e) => e);
    expect(error).toBeInstanceOf(MarketApiError);
    expect(error).toMatchObject({ status: 404, code: "UNKNOWN_TICKER" });
  });

  test("200이어도 형태가 틀리면 던진다(오염된 응답을 화면에 넘기지 않는다)", async () => {
    const config: MarketApiConfig = {
      baseUrl: "",
      fetch: async () => ({
        ok: true,
        status: 200,
        json: async () => ({ quotes: [{ ticker: "AAPL", price: "1" }] }),
      }),
    };
    await expect(fetchQuotes(config)).rejects.toThrow();
  });
});

describe("조회 설정", () => {
  test("시세는 1초마다, 화면이 보이지 않으면 멈춘다", () => {
    const options = quotesQueryOptions(fakeApi().config);
    expect(options.queryKey).toEqual(["market", "quotes"]);
    expect(options.refetchInterval).toBe(1_000);
    expect(options.refetchIntervalInBackground).toBe(false);
    // 1초 안에 다시 연 화면은 새로 받지 않고, 실패는 다음 폴링이 곧 재시도다
    expect(options.staleTime).toBe(1_000);
    expect(options.retry).toBe(false);
  });

  test("이력은 확정 오류(4xx·형태 오류)를 재시도하지 않고, 일시 오류는 1초 간격으로 2번까지", () => {
    const { retry, retryDelay } = historyQueryOptions(
      fakeApi().config,
      "AAPL",
      "1h",
    );
    if (typeof retry !== "function") throw new Error("retry는 함수여야 한다");
    expect(retry(0, new MarketApiError(404, "UNKNOWN_TICKER", ""))).toBe(false);
    expect(retry(0, new MarketApiError(400, "INVALID_RANGE", ""))).toBe(false);
    expect(retry(0, new z.ZodError([]))).toBe(false);
    expect(retry(0, new MarketApiError(502, "HTTP_ERROR", ""))).toBe(true);
    expect(retry(0, new TypeError("Network request failed"))).toBe(true);
    expect(retry(2, new TypeError("Network request failed"))).toBe(false);
    expect(retryDelay).toBe(1_000);
  });

  test("기간을 바꾸는 동안 같은 종목의 이전 차트만 유지한다(다른 종목 차트는 남기지 않는다)", () => {
    const { placeholderData } = historyQueryOptions(
      fakeApi().config,
      "AAPL",
      "1d",
    );
    if (typeof placeholderData !== "function") throw new Error("함수여야 한다");
    const prev = (ticker: string) => ({
      ticker,
      range: "1h" as const,
      points: [],
    });
    expect(placeholderData(prev("AAPL"), undefined)).toEqual(prev("AAPL"));
    expect(placeholderData(prev("MSFT"), undefined)).toBeUndefined();
    expect(placeholderData(undefined, undefined)).toBeUndefined();
  });

  test("이력은 기간 간격마다 다시 받고, 기간을 바꾸는 동안 이전 차트를 유지한다", () => {
    const config = fakeApi().config;
    const hour = historyQueryOptions(config, "AAPL", "1h");
    expect(hour.queryKey).toEqual(["market", "history", "AAPL", "1h"]);
    expect(hour.refetchInterval).toBe(30_000);
    expect(historyQueryOptions(config, "AAPL", "1m").refetchInterval).toBe(
      6 * 60 * 60_000,
    );
  });
});

describe("요청 공유", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("목록과 상세가 함께 보여도 시세 요청은 초당 1회다(응답 지연·구독 시차가 있는 현실 조건)", async () => {
    const { config, urls } = fakeApi();
    const startedAt: number[] = [];
    const t0 = Date.now();
    // 응답이 300ms 걸리는 서버
    const slow: MarketApiConfig = {
      ...config,
      fetch: (url, init) => {
        startedAt.push(Date.now() - t0);
        return new Promise((resolve) =>
          later(() => resolve(config.fetch(url, init)), 300),
        );
      },
    };
    const client = new QueryClient();
    const list = new QueryObserver(client, quotesQueryOptions(slow));
    const stops = [list.subscribe(() => {})];
    // 상세 화면은 0.5초 뒤에 열린다(목록은 스택 아래에 그대로 있다)
    await vi.advanceTimersByTimeAsync(500);
    const detail = new QueryObserver(client, {
      ...quotesQueryOptions(slow),
      select: (data) => data.quotes.find((q) => q.ticker === "AAPL"),
    });
    stops.push(detail.subscribe(() => {}));
    await vi.advanceTimersByTimeAsync(10_000);
    for (const stop of stops) stop();
    client.clear();
    // 10.5초 동안 초당 1회면 11회 안팎. 화면마다 타이머가 돌면 20회 안팎
    expect(urls.length).toBeGreaterThanOrEqual(8);
    expect(urls.length).toBeLessThanOrEqual(12);
    // 상세가 열릴 때 1초가 안 된 시세를 또 받지 않는다(staleTime)
    expect(startedAt[1]).toBeGreaterThanOrEqual(1_000);
  });
});

describe("withLivePoint", () => {
  const points = [
    { t: NOW - 60_000, p: 1 },
    { t: NOW - 30_000, p: 2 },
  ];

  test("시세가 마지막 점보다 새로우면 뒤에 이어 붙인다", () => {
    const quote = quoteAt("AAPL", NOW);
    expect(withLivePoint(points, quote)).toEqual([
      ...points,
      { t: quote.asOf, p: quote.price },
    ]);
  });

  test("이력을 아직 못 받았으면(빈 배열) 시세 하나로 점을 만들지 않는다", () => {
    expect(withLivePoint([], quoteAt("AAPL", NOW))).toEqual([]);
  });

  test("시세가 없거나 마지막 점보다 오래되면 그대로 둔다", () => {
    expect(withLivePoint(points, undefined)).toBe(points);
    expect(withLivePoint(points, quoteAt("AAPL", NOW - 45_000))).toBe(points);
  });
});
