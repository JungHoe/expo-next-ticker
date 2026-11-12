"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type MarketApiConfig, MarketApiProvider } from "@ticker/market/react";
import { type ReactNode, useState } from "react";

/** 웹은 같은 출처의 /api를 부른다 */
const marketApi: MarketApiConfig = {
  baseUrl: "",
  fetch: (url, init) =>
    fetch(url, { signal: init?.signal as AbortSignal | undefined }),
};

export function Providers({ children }: { children: ReactNode }) {
  // 요청마다 새 클라이언트를 만들지 않도록 컴포넌트 수명 동안 하나만 둔다
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <MarketApiProvider config={marketApi}>{children}</MarketApiProvider>
    </QueryClientProvider>
  );
}
