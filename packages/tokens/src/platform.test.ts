import { describe, expect, test } from "vitest";
import { oklchToHex } from "./color";
import { cssVariables, hexColors, kebab } from "./platform";
import { type ColorToken, colors, radius, rule, space, text } from "./tokens";

const tokenNames = Object.keys(colors.light) as ColorToken[];

/** "@media (...) { :root { ... } }" 앞뒤를 나눈다 */
function split(css: string) {
  const at = css.indexOf("@media (prefers-color-scheme: dark)");
  return { light: css.slice(0, at), dark: css.slice(at) };
}

describe("cssVariables (웹)", () => {
  const css = cssVariables();

  test.each(
    tokenNames,
  )("라이트 %s가 :root에 원본 oklch 값으로 있다", (name) => {
    expect(split(css).light).toContain(
      `--color-${name}: ${colors.light[name]};`,
    );
  });

  test.each(
    tokenNames,
  )("다크 %s가 prefers-color-scheme: dark 안에 있다", (name) => {
    expect(split(css).dark).toContain(`--color-${name}: ${colors.dark[name]};`);
  });

  test("간격·글자 크기·선·모서리는 px 단위 변수다", () => {
    for (const [name, value] of Object.entries(space)) {
      expect(css).toContain(`--space-${name}: ${value}px;`);
    }
    for (const [name, value] of Object.entries(text)) {
      expect(css).toContain(`--text-${kebab(name)}: ${value}px;`);
    }
    expect(css).toContain(`--rule-hair: ${rule.hair}px;`);
    expect(css).toContain(`--radius-control: ${radius.control}px;`);
  });

  test("CSS 변수 이름은 kebab-case다", () => {
    expect(css).toContain("--text-price-compact: 40px;");
    expect(css).not.toMatch(/--[a-z-]*[A-Z]/);
  });

  test("브라우저 기본 UI도 라이트·다크를 따른다", () => {
    expect(split(css).light).toContain("color-scheme: light dark;");
  });

  test("값이 빠진 변수가 없다", () => {
    expect(css).not.toMatch(/undefined|NaN/);
  });
});

describe("hexColors (앱)", () => {
  test.each([
    "light",
    "dark",
  ] as const)("%s의 모든 토큰이 #rrggbb이고 원본을 변환한 값이다", (mode) => {
    for (const name of tokenNames) {
      expect(hexColors[mode][name]).toMatch(/^#[0-9a-f]{6}$/);
      expect(hexColors[mode][name]).toBe(oklchToHex(colors[mode][name]));
    }
  });
});
