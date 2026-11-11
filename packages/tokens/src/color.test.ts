import { describe, expect, test } from "vitest";
import { contrastRatio, oklchToHex, oklchToSrgb, parseOklch } from "./color";

describe("parseOklch", () => {
  test("CSS oklch() 문자열에서 L(0~1), C, H를 읽는다", () => {
    expect(parseOklch("oklch(84% 0.012 245)")).toEqual({
      l: 0.84,
      c: 0.012,
      h: 245,
    });
  });

  test("oklch() 형식이 아니면 예외를 던진다", () => {
    expect(() => parseOklch("#ffffff")).toThrow();
  });
});

describe("oklchToSrgb", () => {
  test("명도 100%, 채도 0은 흰색이다", () => {
    const { r, g, b } = oklchToSrgb({ l: 1, c: 0, h: 0 });
    expect(r).toBeCloseTo(1, 3);
    expect(g).toBeCloseTo(1, 3);
    expect(b).toBeCloseTo(1, 3);
  });

  test("명도 0은 검정이다", () => {
    expect(oklchToSrgb({ l: 0, c: 0, h: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  test("CSS Color 4 기준값: sRGB 빨강은 oklch(62.796% 0.25768 29.2339)", () => {
    const { r, g, b } = oklchToSrgb({ l: 0.62796, c: 0.25768, h: 29.2339 });
    expect(r).toBeCloseTo(1, 2);
    expect(g).toBeCloseTo(0, 2);
    expect(b).toBeCloseTo(0, 2);
  });

  test("sRGB 범위를 벗어난 색은 0~1로 자른다", () => {
    const { r, g, b } = oklchToSrgb({ l: 0.7, c: 0.4, h: 145 });
    for (const v of [r, g, b]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("oklchToHex", () => {
  test("흰색과 검정을 #rrggbb로 바꾼다", () => {
    expect(oklchToHex("oklch(100% 0 0)")).toBe("#ffffff");
    expect(oklchToHex("oklch(0% 0 0)")).toBe("#000000");
  });
});

describe("contrastRatio (WCAG 2)", () => {
  test("흰색과 검정은 21:1이다", () => {
    expect(contrastRatio("oklch(100% 0 0)", "oklch(0% 0 0)")).toBeCloseTo(
      21,
      1,
    );
  });

  test("같은 색은 1:1이고, 순서를 바꿔도 같다", () => {
    expect(contrastRatio("oklch(50% 0.1 30)", "oklch(50% 0.1 30)")).toBeCloseTo(
      1,
      5,
    );
    expect(contrastRatio("oklch(30% 0 0)", "oklch(90% 0 0)")).toBeCloseTo(
      contrastRatio("oklch(90% 0 0)", "oklch(30% 0 0)"),
      5,
    );
  });
});
