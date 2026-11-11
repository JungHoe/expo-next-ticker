/**
 * 디자인 토큰 원본. 재료는 Hallmark 테마 Almanac(종이·잉크·글꼴·선)이고,
 * 색은 상승·하락에만 쓴다. 근거와 결정: docs/spec/design-tokens.md
 */

const light = {
  paper: "oklch(84% 0.012 245)",
  "paper-2": "oklch(81% 0.012 245)",
  sheet: "oklch(93.5% 0.008 245)",
  ink: "oklch(16% 0.020 245)",
  "ink-2": "oklch(24% 0.018 245)",
  muted: "oklch(38% 0.016 245)",
  rule: "oklch(73% 0.013 240)",
  "rule-2": "oklch(32% 0.018 240)",
  up: "oklch(42% 0.16 25)",
  down: "oklch(42% 0.15 262)",
} as const;

export type ColorToken = keyof typeof light;

/** Almanac의 잉크 띠(남색 바탕 + 종이색 글자)에서 출발한 다크 */
const dark: Record<ColorToken, string> = {
  paper: "oklch(16% 0.020 245)",
  "paper-2": "oklch(26% 0.020 245)",
  sheet: "oklch(21% 0.018 245)",
  ink: "oklch(95% 0.008 245)",
  "ink-2": "oklch(88% 0.010 245)",
  muted: "oklch(72% 0.014 245)",
  rule: "oklch(32% 0.016 240)",
  "rule-2": "oklch(70% 0.014 240)",
  up: "oklch(72% 0.15 25)",
  down: "oklch(74% 0.12 262)",
};

export const colors = { light, dark } satisfies Record<
  string,
  Record<ColorToken, string>
>;
export type ColorMode = keyof typeof colors;

export const font = {
  display: { family: "Hanken Grotesk", weight: 600, tracking: -0.02 },
  body: { family: "Newsreader", weights: [400, 500] },
  number: { family: "IBM Plex Mono", weights: [400, 500] },
} as const;

/** px. 숫자 칸은 font.number + tabular-nums */
export const text = {
  label: 13,
  body: 16,
  title: 19,
  heading: 23,
  priceCompact: 40,
  price: 56,
} as const;

/** px, 4px 배수 */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** px. 행 구분 1px, 제목·표 머리 아래 2px */
export const rule = { hair: 1, bar: 2 } as const;

/** px. 면은 각지게, 컨트롤만 2px */
export const radius = { surface: 0, control: 2 } as const;
