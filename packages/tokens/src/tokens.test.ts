import { describe, expect, test } from "vitest";
import { contrastRatio, parseOklch } from "./color";
import { type ColorMode, colors, radius, rule, space } from "./tokens";

const modes = Object.keys(colors) as ColorMode[];
const foregrounds = ["up", "down", "ink", "ink-2", "muted"] as const;
const backgrounds = ["paper", "paper-2", "sheet"] as const;

describe("colors", () => {
  test("라이트와 다크가 있다", () => {
    expect(modes.sort()).toEqual(["dark", "light"]);
  });

  test("라이트와 다크의 토큰 이름이 같다", () => {
    expect(Object.keys(colors.dark).sort()).toEqual(
      Object.keys(colors.light).sort(),
    );
  });

  test("모든 값이 oklch() 문자열이다", () => {
    for (const mode of modes) {
      for (const value of Object.values(colors[mode])) {
        expect(() => parseOklch(value)).not.toThrow();
      }
    }
  });

  // design-tokens.md §5: 목업에서 처음 고른 상승 빨강이 선택된 행 위에서 3.63:1로 걸렸다
  const pairs = modes.flatMap((mode) =>
    foregrounds.flatMap((fg) =>
      backgrounds.map((bg) => [mode, fg, bg] as const),
    ),
  );
  test.each(
    pairs,
  )("%s: %s 글자가 %s 바탕 위에서 대비 4.5:1 이상", (mode, fg, bg) => {
    const ratio = contrastRatio(colors[mode][fg], colors[mode][bg]);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe("형태", () => {
  test("간격은 모두 4px 배수다", () => {
    for (const value of Object.values(space)) {
      expect(value % 4).toBe(0);
    }
  });

  test("선은 1px과 2px 두 가지뿐이다", () => {
    expect(rule).toEqual({ hair: 1, bar: 2 });
  });

  test("면의 모서리는 0, 컨트롤은 2px 이하다", () => {
    expect(radius.surface).toBe(0);
    expect(radius.control).toBeLessThanOrEqual(2);
  });
});
