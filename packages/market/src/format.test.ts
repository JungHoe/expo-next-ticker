import { describe, expect, test } from "vitest";
import {
  changeTone,
  chartDescription,
  formatPercent,
  formatPrice,
  formatSigned,
  HISTORY_RANGE_LABEL,
  parseHistoryRange,
  quoteLabel,
  secondsSince,
} from "./format";
import type { Quote } from "./schema";

const quote = (change: number, changePct: number): Quote => ({
  ticker: "AAPL",
  name: "Apple",
  price: 231.42,
  base: 229.56,
  change,
  changePct,
  high: 232.1,
  low: 228.95,
  asOf: 0,
});

describe("서식", () => {
  test("가격은 소수 둘째 자리까지 고정한다(자릿수가 흔들리지 않게)", () => {
    expect(formatPrice(231.4)).toBe("231.40");
    expect(formatPrice(1000)).toBe("1,000.00");
    expect(formatPrice(0.5)).toBe("0.50");
  });

  test("등락은 부호를 붙이고 0은 부호 없이", () => {
    expect(formatSigned(1.86)).toBe("+1.86");
    expect(formatSigned(-1.5)).toBe("-1.50");
    expect(formatSigned(0)).toBe("0.00");
  });

  test("등락률은 부호와 %를 붙인다", () => {
    expect(formatPercent(0.81)).toBe("+0.81%");
    expect(formatPercent(-0.5)).toBe("-0.50%");
    expect(formatPercent(0)).toBe("0.00%");
  });
});

describe("changeTone", () => {
  test("0보다 크면 상승, 작으면 하락, 0이면 보합", () => {
    expect(changeTone(0.01)).toBe("up");
    expect(changeTone(-0.01)).toBe("down");
    expect(changeTone(0)).toBe("flat");
  });
});

describe("quoteLabel (보조 기술이 읽는 이름)", () => {
  test("종목·가격·등락을 문장으로", () => {
    expect(quoteLabel(quote(1.86, 0.81))).toBe(
      "AAPL Apple, 231.42달러, 0.81% 상승",
    );
    expect(quoteLabel(quote(-1.15, -0.5))).toBe(
      "AAPL Apple, 231.42달러, 0.50% 하락",
    );
    expect(quoteLabel(quote(0, 0))).toBe("AAPL Apple, 231.42달러, 보합");
  });

  test("등락이 -0.01이어도 등락률이 0.00%로 반올림되면 보합으로 읽는다(보이는 값과 맞춘다)", () => {
    expect(quoteLabel(quote(-0.01, 0))).toBe("AAPL Apple, 231.42달러, 보합");
  });
});

describe("secondsSince", () => {
  test("초 단위로 내린다", () => {
    expect(secondsSince(1_000, 4_900)).toBe(3);
    expect(secondsSince(1_000, 1_000)).toBe(0);
  });

  test("시계가 어긋나 미래 시각이 와도 음수가 되지 않는다", () => {
    expect(secondsSince(5_000, 1_000)).toBe(0);
  });
});

describe("기간", () => {
  test("주소의 range를 해석하고, 모르면 1시간", () => {
    expect(parseHistoryRange("1d")).toBe("1d");
    expect(parseHistoryRange("1m")).toBe("1m");
    expect(parseHistoryRange("2y")).toBe("1h");
    expect(parseHistoryRange(null)).toBe("1h");
    expect(parseHistoryRange(undefined)).toBe("1h");
    expect(parseHistoryRange(["1w"])).toBe("1w");
  });

  test("이름", () => {
    expect(HISTORY_RANGE_LABEL).toEqual({
      "1h": "1시간",
      "1d": "1일",
      "1w": "1주",
      "1m": "1개월",
    });
  });
});

describe("chartDescription (차트 대체 텍스트)", () => {
  test("시작·끝·고가·저가를 문장으로", () => {
    const points = [229.8, 232.1, 228.95, 231.42].map((p, i) => ({ t: i, p }));
    expect(chartDescription("AAPL", "1h", points)).toBe(
      "AAPL 최근 1시간, 229.80에서 231.42, 고가 232.10, 저가 228.95",
    );
  });

  test("점이 없으면 undefined", () => {
    expect(chartDescription("AAPL", "1h", [])).toBeUndefined();
  });
});
