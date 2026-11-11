export type Ticker = {
  symbol: string;
  name: string;
  /** 시뮬레이션 기준가(달러). 실제 시세가 아니다 */
  base: number;
  /** 0~1. 가격이 흔들리는 폭의 상대 크기 */
  volatility: number;
};

/** 관심 종목 고정 목록. 순서가 곧 화면 순서다(market-data.md §3) */
export const TICKERS: readonly Ticker[] = [
  { symbol: "AAPL", name: "Apple", base: 230, volatility: 0.8 },
  { symbol: "MSFT", name: "Microsoft", base: 420, volatility: 0.7 },
  { symbol: "NVDA", name: "NVIDIA", base: 140, volatility: 1 },
  { symbol: "AMZN", name: "Amazon", base: 195, volatility: 0.85 },
  { symbol: "GOOGL", name: "Alphabet", base: 170, volatility: 0.8 },
  { symbol: "META", name: "Meta Platforms", base: 580, volatility: 0.9 },
  { symbol: "TSLA", name: "Tesla", base: 250, volatility: 1 },
  { symbol: "AVGO", name: "Broadcom", base: 175, volatility: 0.95 },
  { symbol: "JPM", name: "JPMorgan Chase", base: 220, volatility: 0.6 },
  { symbol: "V", name: "Visa", base: 290, volatility: 0.55 },
];

const BY_SYMBOL = new Map(TICKERS.map((t) => [t.symbol, t]));

export function findTicker(symbol: string): Ticker | undefined {
  return BY_SYMBOL.get(symbol);
}
