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

  /** 선택자 하나의 { } 안을 꺼낸다 */
  function block(selector: string) {
    const start = css.indexOf(`${selector} {`);
    if (start < 0) return "";
    return css.slice(start, css.indexOf("}", start));
  }

  test('기기 설정 다크는 data-theme="light"가 아닐 때만 적용된다(앱이 정한 테마 우선)', () => {
    expect(split(css).dark).toContain(':root:not([data-theme="light"]) {');
    expect(split(css).dark).not.toMatch(
      /@media \(prefers-color-scheme: dark\) \{\s*:root \{/,
    );
  });

  test.each(
    tokenNames,
  )('data-theme="dark"이면 기기 설정과 관계없이 다크 %s', (name) => {
    expect(block(':root[data-theme="dark"]')).toContain(
      `--color-${name}: ${colors.dark[name]};`,
    );
  });

  test("data-theme이 브라우저 기본 UI 색(color-scheme)도 정한다", () => {
    expect(block(':root[data-theme="dark"]')).toContain("color-scheme: dark;");
    expect(block(':root[data-theme="light"]')).toContain(
      "color-scheme: light;",
    );
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

  test("한글 대체 글꼴은 고딕으로 정해 둔다(OS 기본 명조로 빠지지 않게)", () => {
    expect(css).toMatch(
      /--font-hangul: [^;]*"Apple SD Gothic Neo"[^;]*"Malgun Gothic"[^;]*sans-serif;/,
    );
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
