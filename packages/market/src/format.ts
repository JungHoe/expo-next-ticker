/**
 * 웹·앱이 같이 쓰는 표시 규칙(watchlist.md §2, stock-detail.md §2).
 * Intl 대신 직접 만들어 Node·브라우저·Hermes가 같은 글자를 낸다.
 */
import type { Quote } from "./schema";

/** 1234.5 → "1,234.50". 소수 둘째 자리 고정이라 값이 바뀌어도 자릿수가 흔들리지 않는다 */
export function formatPrice(value: number): string {
  const [integer = "0", fraction = "00"] = Math.abs(value)
    .toFixed(2)
    .split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}${grouped}.${fraction}`;
}

/** +1.86 / -1.50 / 0.00 */
export function formatSigned(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatPrice(Math.abs(value))}`;
}

/** +0.81% / -0.50% / 0.00% */
export function formatPercent(value: number): string {
  return `${formatSigned(value)}%`;
}

export type ChangeTone = "up" | "down" | "flat";

/** 색은 상승·하락에만 쓴다. 0은 잉크색 */
export function changeTone(change: number): ChangeTone {
  return change > 0 ? "up" : change < 0 ? "down" : "flat";
}

/** 보조 기술이 읽는 이름. "AAPL Apple, 231.42달러, 0.81% 상승" */
export function quoteLabel(quote: Quote): string {
  const tone = changeTone(quote.change);
  const movement =
    tone === "flat"
      ? "보합"
      : `${formatPrice(Math.abs(quote.changePct))}% ${tone === "up" ? "상승" : "하락"}`;
  return `${quote.ticker} ${quote.name}, ${formatPrice(quote.price)}달러, ${movement}`;
}

/** 마지막으로 받은 뒤 지난 초. "N초 전 시세"에 쓴다 */
export function secondsSince(time: number, now: number): number {
  return Math.max(0, Math.floor((now - time) / 1_000));
}
