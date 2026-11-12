/**
 * 같은 토큰 원본에서 플랫폼별 형태를 만든다.
 * - 웹: CSS 변수(`:root`, 다크는 prefers-color-scheme). 원본 oklch 값을 그대로 쓴다
 * - 앱: React Native 스타일에 바로 넣는 #rrggbb. 모듈을 불러올 때 한 번만 변환한다
 */
import { oklchToHex } from "./color";
import {
  type ColorMode,
  type ColorToken,
  colors,
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
  const light = declarations([
    ...colorEntries("light"),
    ...px("space", space),
    ...px("text", text),
    ...px("rule", rule),
    ...px("radius", radius),
  ]);
  return [
    ":root {",
    "  color-scheme: light dark;",
    light,
    "}",
    "@media (prefers-color-scheme: dark) {",
    "  :root {",
    declarations(colorEntries("dark"))
      .replaceAll("\n", "\n  ")
      .replace(/^/, "  "),
    "  }",
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
