import {
  type DehydratedState,
  dehydrate,
  QueryClient,
} from "@tanstack/react-query";
import { QUOTES_QUERY_KEY, quotesResponse } from "@ticker/market";

/**
 * 시각 `at`의 전체 시세를 브라우저에 넘길 TanStack Query 상태로 만든다(docs/spec/seo-isr.md §3).
 * dehydrate()가 dehydratedAt에 Date.now()를 넣으므로, 이 함수는 'use cache' 안에서만 부른다(quotes-snapshot.tsx)
 */
export async function snapshotState(at: number): Promise<DehydratedState> {
  const result = quotesResponse([], at);
  // 빈 입력은 고정 목록 전체라 실패하지 않는다. 실패하면 빌드를 멈춰 알린다
  if (result.status !== 200) throw new Error("시세 스냅샷을 만들지 못했습니다");

  const queryClient = new QueryClient();
  queryClient.setQueryData(QUOTES_QUERY_KEY, result.body, { updatedAt: at });
  // 스냅샷은 받자마자 새로 받아야 하는 값이다. 무효 표시가 있으면 TanStack이 시계와 비교하지 않고 바로 오래된
  // 값으로 본다(query-core query.js isStaleByTime). 그래서 서버 렌더 중 useQuery가 Date.now()를 읽지 않고,
  // 브라우저는 하이드레이션 직후 새로 받는다. refetchType "none": 서버에서는 무효 표시만 하고 받지 않는다
  await queryClient.invalidateQueries({
    queryKey: QUOTES_QUERY_KEY,
    refetchType: "none",
  });
  return dehydrate(queryClient);
}
