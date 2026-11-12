import { describe, expect, test } from "vitest";
import {
  changeTone,
  formatPercent,
  formatPrice,
  formatSigned,
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
