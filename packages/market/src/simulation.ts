/**
 * 결정적 시뮬레이션 시세. 같은 종목·같은 초면 어디서 계산해도 같은 값이고,
 * 과거부터 쌓지 않고 어떤 시각이든 바로 계산한다(O(1)). 근거: docs/spec/market-data.md §3
 *
 * price(t) = base × exp(Σ aₖ·sin(2πt/Pₖ + φₖ) + 초 단위 잡음)
 * - Pₖ: 97초~약 24일, 서로 배수가 아닌 주기 → 1시간 화면에서 반복 무늬가 보이지 않는다
 * - aₖ ∝ √Pₖ: 긴 주기일수록 크게 흔들려 랜덤워크처럼 보인다
 * - Σaₖ + 잡음 ≤ 0.2005 → 가격은 항상 base × [0.818, 1.223] 안에 있다(±25% 보장)
 */
import type { HistoryPoint, HistoryRange, Quote } from "./schema";
import { findTicker, type Ticker } from "./tickers";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;

const PERIODS_SECONDS = [
  97, 263, 701, 1_879, 4_799, 13_007, 36_541, 98_777, 271_003, 755_009,
  2_089_997,
];
const TOTAL_AMPLITUDE = 0.2;
const TICK_NOISE = 0.0005;

const SQRT_SUM = PERIODS_SECONDS.reduce((sum, p) => sum + Math.sqrt(p), 0);

/** FNV-1a 32비트 */
function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 두 정수를 섞어 [0, 1) 값으로 */
function hash01(seed: number, n: number): number {
  let h = Math.imul(seed ^ n, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca77);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae3d);
  h ^= h >>> 16;
  return (h >>> 0) / 0x1_0000_0000;
}

type Wave = { amplitude: number; omega: number; phase: number };
type Model = { ticker: Ticker; seed: number; waves: Wave[] };

const models = new Map<string, Model>();

function modelOf(symbol: string): Model {
  const cached = models.get(symbol);
  if (cached) return cached;
  const ticker = findTicker(symbol);
  if (!ticker) throw new Error(`목록에 없는 종목입니다: ${symbol}`);
  const seed = hashString(symbol);
  const waves = PERIODS_SECONDS.map((period, k) => ({
    amplitude:
      ((TOTAL_AMPLITUDE * Math.sqrt(period)) / SQRT_SUM) * ticker.volatility,
    omega: (2 * Math.PI) / period,
    phase: hash01(seed, k) * 2 * Math.PI,
  }));
  const model = { ticker, seed, waves };
  models.set(symbol, model);
  return model;
}

/** 소수 둘째 자리 반올림. `+ 0`은 -0을 0으로 바꾼다(화면에 "-0.00%"가 나오지 않게) */
const round2 = (v: number) => Math.round(v * 100) / 100 + 0;

/** 종목의 time(ms) 시점 가격. 초 단위로 내려 계산한다 */
export function priceAt(symbol: string, time: number): number {
  const { ticker, seed, waves } = modelOf(symbol);
  const second = Math.floor(time / SECOND);
  let log = (hash01(seed, second) * 2 - 1) * TICK_NOISE;
  for (const { amplitude, omega, phase } of waves) {
    log += amplitude * Math.sin(omega * second + phase);
  }
  return round2(ticker.base * Math.exp(log));
}

/** time(ms)이 속한 날의 0시(KST)를 epoch ms로. KST에는 서머타임이 없다 */
export function kstMidnight(time: number): number {
  return Math.floor((time + KST_OFFSET) / DAY) * DAY - KST_OFFSET;
}

export function quoteAt(symbol: string, now: number): Quote {
  const { ticker } = modelOf(symbol);
  const midnight = kstMidnight(now);
  const price = priceAt(symbol, now);
  const base = priceAt(symbol, midnight);
  let high = price;
  let low = price;
  for (let t = midnight; t <= now; t += MINUTE) {
    const p = priceAt(symbol, t);
    if (p > high) high = p;
    if (p < low) low = p;
  }
  const change = round2(price - base);
  return {
    ticker: symbol,
    name: ticker.name,
    price,
    base,
    change,
    changePct: round2((change / base) * 100),
    high,
    low,
    asOf: Math.floor(now / SECOND) * SECOND,
  };
}

/** 기간별 점 간격(ms)과 개수. 클라이언트도 이 간격마다 이력을 다시 받는다 */
export const HISTORY_SHAPE: Record<
  HistoryRange,
  { step: number; count: number }
> = {
  "1h": { step: 30 * SECOND, count: 121 },
  "1d": { step: 10 * MINUTE, count: 145 },
  "1w": { step: HOUR, count: 169 },
  "1m": { step: 6 * HOUR, count: 121 },
};

/** 기간별 차트 점. 마지막 점은 now 이전의 간격 경계라 같은 간격 안에서는 결과가 같다 */
export function historyAt(
  symbol: string,
  range: HistoryRange,
  now: number,
): HistoryPoint[] {
  const { step, count } = HISTORY_SHAPE[range];
  const end = Math.floor(now / step) * step;
  return Array.from({ length: count }, (_, i) => {
    const t = end - (count - 1 - i) * step;
    return { t, p: priceAt(symbol, t) };
  });
}
