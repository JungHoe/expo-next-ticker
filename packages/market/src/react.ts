/**
 * React 진입점(`@ticker/market/react`). 훅과 TanStack Query 설정은 여기서만 내보낸다.
 * 서버 코드(웹 API Route Handler)가 `@ticker/market`을 import할 때 React 훅이 딸려 가지 않게 나눴다.
 */
export type { MarketApiConfig } from "./client";
export {
  MarketApiProvider,
  useHistory,
  useQuote,
  useQuoteFreshness,
  useQuotes,
} from "./hooks";
export {
  historyQueryOptions,
  msUntilNextTick,
  QUOTES_REFETCH_MS,
  quotesQueryOptions,
  withLivePoint,
} from "./query";
