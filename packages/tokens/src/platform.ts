/**
 * 같은 토큰 원본에서 플랫폼별 형태를 만든다.
 * - 웹: CSS 변수(`:root`, 다크는 prefers-color-scheme 또는 `<html data-theme="dark">`). 원본 oklch 값을 그대로 쓴다
 * - 앱: React Native 스타일에 바로 넣는 #rrggbb. 모듈을 불러올 때 한 번만 변환한다
 */
import { oklchToHex } from "./color";
import {
  type ColorMode,
  type ColorToken,
  colors,
  font,
  radius,
  rule,
  space,
  text,
} from "./tokens";

function declarations(entries: [string, string][]): string {
  return entries.map(([name, value]) => `  --${name}: ${value};`).join("\n");
}

/** priceCompact → price-compact */
export const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const px = (
  group: string,
  values: Record<string, number>,
): [string, string][] =>
  Object.entries(values).map(([name, value]) => [
    `${group}-${kebab(name)}`,
    `${value}px`,
  ]);

const colorEntries = (mode: ColorMode): [string, string][] =>
  Object.entries(colors[mode]).map(([name, value]) => [`color-${name}`, value]);

export function cssVariables(): string {
  const hangul = font.hangulFallback
    .map((family) => (family.includes(" ") ? `"${family}"` : family))
    .join(", ");
  const light = declarations([
    ["font-hangul", hangul],
    ...colorEntries("light"),
    ...px("space", space),
    ...px("text", text),
    ...px("rule", rule),
    ...px("radius", radius),
  ]);
  const dark = declarations(colorEntries("dark"));
  return [
    ":root {",
    "  color-scheme: light dark;",
    light,
    "}",
    // <html data-theme>이 있으면 기기 설정보다 그 값을 따른다. 앱이 WebView에 테마를 정해 주기 때문이다
    // (docs/spec/webview-bridge.md §3). 없으면 기기 설정(prefers-color-scheme)을 따른다
    "@media (prefers-color-scheme: dark) {",
    '  :root:not([data-theme="light"]) {',
    dark.replaceAll("\n", "\n  ").replace(/^/, "  "),
    "  }",
    "}",
    ':root[data-theme="dark"] {',
    "  color-scheme: dark;",
    dark,
    "}",
    ':root[data-theme="light"] {',
    "  color-scheme: light;",
    "}",
  ].join("\n");
}

const toHex = (mode: ColorMode) =>
  Object.fromEntries(
    Object.entries(colors[mode]).map(([name, value]) => [
      name,
      oklchToHex(value),
    ]),
  ) as Record<ColorToken, string>;

export const hexColors: Record<ColorMode, Record<ColorToken, string>> = {
  light: toHex("light"),
  dark: toHex("dark"),
};
