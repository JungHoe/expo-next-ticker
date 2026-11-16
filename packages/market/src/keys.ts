/**
 * TanStack Query 키. 웹 서버(ISR 시세 스냅샷, docs/spec/seo-isr.md §3)도 같은 키로 브라우저에 넘기므로
 * React 훅이 딸려 오지 않는 기본 진입점(`@ticker/market`)에서 내보낸다
 */
export const QUOTES_QUERY_KEY = ["market", "quotes"] as const;
