import { HydrationBoundary } from "@tanstack/react-query";
import { cacheLife } from "next/cache";
import type { ReactNode } from "react";
import { snapshotState } from "./quotes-snapshot-state";

/**
 * 전체 시세 스냅샷(ISR, docs/spec/seo-isr.md §3). 시각을 읽는 일은 모두 'use cache' 안에서 한다.
 * 여기서 읽은 시각은 결과와 함께 캐시되어 다시 만들 때까지 모두 같은 값을 본다
 * (Next.js 16 문서 01-getting-started/08-caching.md "Random values and timestamps").
 * - Date.now(): 스냅샷 시각
 * - dehydrate(): 쿼리마다 dehydratedAt에 Date.now()를 넣는다(@tanstack/query-core hydration.js). 밖에서 부르면
 *   미리 렌더링이 "unstable value Date.now()"로 멈춘다(#30 빌드에서 확인)
 */
async function quotesSnapshot() {
  "use cache";
  cacheLife("snapshot");
  return snapshotState(Date.now());
}

/** 스냅샷을 브라우저의 TanStack Query 캐시로 넘긴다. 목록과 상세가 같은 키를 쓰므로 둘 다 첫 HTML부터 값이 찬다 */
export async function QuotesSnapshot({ children }: { children: ReactNode }) {
  return (
    <HydrationBoundary state={await quotesSnapshot()}>
      {children}
    </HydrationBoundary>
  );
}
