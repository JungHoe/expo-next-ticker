import { describe, expect, test } from "vitest";
import {
  HISTORY_RANGES,
  historyAt,
  kstMidnight,
  priceAt,
  quoteAt,
} from "./simulation";
import { findTicker, TICKERS } from "./tickers";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// 2026-11-08 00:30:00 KST
const NOW = Date.UTC(2026, 10, 7, 15, 30, 0);

describe("tickers", () => {
  test("고정 10종목이 정해진 순서로 있다", () => {
    expect(TICKERS.map((t) => t.symbol)).toEqual([
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
  });

  test("목록에 없는 티커는 찾지 못한다", () => {
    expect(findTicker("AAPL")?.name).toBe("Apple");
    expect(findTicker("ZZZZ")).toBeUndefined();
  });
});

describe("kstMidnight", () => {
  test("KST 날짜가 바뀐 직후면 그날 0시(UTC 전날 15시)", () => {
    expect(kstMidnight(NOW)).toBe(Date.UTC(2026, 10, 7, 15, 0, 0));
  });

  test("KST 23:59:59면 그 전날 0시", () => {
    expect(kstMidnight(Date.UTC(2026, 10, 7, 14, 59, 59))).toBe(
      Date.UTC(2026, 10, 6, 15, 0, 0),
    );
  });
});

describe("priceAt", () => {
  test("같은 종목, 같은 시각이면 같은 값이다", () => {
    expect(priceAt("NVDA", NOW)).toBe(priceAt("NVDA", NOW));
  });

  test("같은 초 안에서는 값이 같다", () => {
    expect(priceAt("AAPL", NOW + 999)).toBe(priceAt("AAPL", NOW));
  });

  test("초가 바뀌면 값이 움직인다", () => {
    const values = new Set(
      Array.from({ length: 60 }, (_, i) => priceAt("AAPL", NOW + i * SECOND)),
    );
    expect(values.size).toBeGreaterThan(30);
  });

  test("종목마다 값이 다르다", () => {
    const prices = new Set(TICKERS.map((t) => priceAt(t.symbol, NOW)));
    expect(prices.size).toBe(TICKERS.length);
  });

  test("소수 둘째 자리까지다", () => {
    for (const t of TICKERS) {
      const p = priceAt(t.symbol, NOW);
      expect(Math.round(p * 100) / 100).toBe(p);
    }
  });

  test.each(
    TICKERS.map((t) => [t.symbol, t.base] as const),
  )("%s는 30일 동안 기준가 %d의 ±25% 안에 있다(1분 표본)", (symbol, base) => {
    for (let t = NOW - 30 * DAY; t <= NOW; t += MINUTE) {
      const p = priceAt(symbol, t);
      expect(p).toBeGreaterThanOrEqual(base * 0.75);
      expect(p).toBeLessThanOrEqual(base * 1.25);
    }
  });
});

describe("quoteAt", () => {
  const q = quoteAt("MSFT", NOW);

  test("기준가는 오늘 0시(KST)의 가격이다", () => {
    expect(q.base).toBe(priceAt("MSFT", kstMidnight(NOW)));
  });

  test("등락과 등락률은 기준가 대비다", () => {
    expect(q.price).toBe(priceAt("MSFT", NOW));
    expect(q.change).toBeCloseTo(q.price - q.base, 2);
    expect(q.changePct).toBeCloseTo((q.change / q.base) * 100, 2);
  });

  test("고가·저가는 0시부터 1분 표본과 현재가 중 최고·최저다", () => {
    const samples = [q.price];
    for (let t = kstMidnight(NOW); t <= NOW; t += MINUTE) {
      samples.push(priceAt("MSFT", t));
    }
    expect(q.high).toBe(Math.max(...samples));
    expect(q.low).toBe(Math.min(...samples));
    expect(q.high).toBeGreaterThanOrEqual(q.price);
    expect(q.low).toBeLessThanOrEqual(q.price);
  });

  test("asOf는 초 단위로 내린 시각이고 종목 이름을 함께 준다", () => {
    expect(quoteAt("MSFT", NOW + 500).asOf).toBe(NOW);
    expect(q.ticker).toBe("MSFT");
    expect(q.name).toBe("Microsoft");
  });
});

describe("historyAt", () => {
  test.each([
    ["1h", 121, 30 * SECOND],
    ["1d", 145, 10 * MINUTE],
    ["1w", 169, HOUR],
    ["1m", 121, 6 * HOUR],
  ] as const)("%s: %d점, 간격이 일정하다", (range, count, step) => {
    const points = historyAt("AAPL", range, NOW + 12_345);
    expect(points).toHaveLength(count);
    for (let i = 1; i < points.length; i++) {
      expect(points[i]!.t - points[i - 1]!.t).toBe(step);
    }
  });

  test("마지막 점은 지금 이전의 간격 경계이고, 값은 priceAt과 같다", () => {
    const now = NOW + 12_345;
    const points = historyAt("AAPL", "1h", now);
    const last = points.at(-1)!;
    expect(last.t).toBeLessThanOrEqual(now);
    expect(last.t % (30 * SECOND)).toBe(0);
    expect(now - last.t).toBeLessThan(30 * SECOND);
    for (const point of points) {
      expect(point.p).toBe(priceAt("AAPL", point.t));
    }
  });

  test("기간 목록은 1h, 1d, 1w, 1m이다", () => {
    expect([...HISTORY_RANGES]).toEqual(["1h", "1d", "1w", "1m"]);
  });
});
