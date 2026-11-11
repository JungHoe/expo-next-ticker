export type Oklch = { l: number; c: number; h: number };
export type Srgb = { r: number; g: number; b: number };

const OKLCH_PATTERN = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/;

/** `oklch(84% 0.012 245)` → `{ l: 0.84, c: 0.012, h: 245 }` */
export function parseOklch(value: string): Oklch {
  const match = OKLCH_PATTERN.exec(value.trim());
  if (!match) throw new Error(`oklch() 형식이 아닙니다: ${value}`);
  const [, l, c, h] = match;
  return { l: Number(l) / 100, c: Number(c), h: Number(h) };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const encodeGamma = (v: number) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
const decodeGamma = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

/** OKLCH → 감마 적용된 sRGB(0~1). 범위를 벗어나면 채널별로 자른다. */
export function oklchToSrgb({ l, c, h }: Oklch): Srgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const l3 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m3 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s3 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const red = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const green = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  return {
    r: encodeGamma(clamp01(red)),
    g: encodeGamma(clamp01(green)),
    b: encodeGamma(clamp01(blue)),
  };
}

const toByteHex = (v: number) =>
  Math.round(v * 255)
    .toString(16)
    .padStart(2, "0");

/** `oklch(...)` 문자열 → `#rrggbb` */
export function oklchToHex(value: string): string {
  const { r, g, b } = oklchToSrgb(parseOklch(value));
  return `#${toByteHex(r)}${toByteHex(g)}${toByteHex(b)}`;
}

function relativeLuminance(value: string): number {
  const { r, g, b } = oklchToSrgb(parseOklch(value));
  return (
    0.2126 * decodeGamma(r) + 0.7152 * decodeGamma(g) + 0.0722 * decodeGamma(b)
  );
}

/** WCAG 2 대비. 두 색의 순서와 무관하게 1~21 */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  ) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
