// 훅은 브라우저·RN에서 돈다. TanStack Query는 window가 없으면 서버로 보고 refetchInterval을 끄므로
// 이 파일은 브라우저 환경에서 돌린다
// @vitest-environment happy-dom
import {
  keepPreviousData,
  QueryClient,
  QueryObserver,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
  });

  test("이력은 기간 간격마다 다시 받고, 기간을 바꾸는 동안 이전 차트를 유지한다", () => {
    const config = fakeApi().config;
    const hour = historyQueryOptions(config, "AAPL", "1h");
    expect(hour.queryKey).toEqual(["market", "history", "AAPL", "1h"]);
    expect(hour.refetchInterval).toBe(30_000);
    expect(hour.placeholderData).toBe(keepPreviousData);
    expect(historyQueryOptions(config, "AAPL", "1m").refetchInterval).toBe(
      6 * 60 * 60_000,
    );
  });
});

describe("요청 공유", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("목록과 상세가 함께 보여도 시세 요청은 초당 1회다", async () => {
    const { config, urls } = fakeApi();
    const client = new QueryClient();
    const list = new QueryObserver(client, quotesQueryOptions(config));
    const detail = new QueryObserver(client, {
      ...quotesQueryOptions(config),
      select: (data) => data.quotes.find((q) => q.ticker === "AAPL"),
    });
    const stops = [list.subscribe(() => {}), detail.subscribe(() => {})];
    await vi.advanceTimersByTimeAsync(3_000);
    for (const stop of stops) stop();
    client.clear();
    // 처음 1회 + 3초 동안 3회. 화면마다 따로 받았다면 8회
    expect(urls.length).toBeLessThanOrEqual(4);
    expect(urls.length).toBeGreaterThanOrEqual(3);
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

  test("시세가 없거나 마지막 점보다 오래되면 그대로 둔다", () => {
    expect(withLivePoint(points, undefined)).toBe(points);
    expect(withLivePoint(points, quoteAt("AAPL", NOW - 45_000))).toBe(points);
  });
});
