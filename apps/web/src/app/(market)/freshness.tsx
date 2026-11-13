"use client";

import { useQuoteFreshness } from "@ticker/market/react";

/**
 * 값이 있다가 끊겼을 때(오류·오프라인) "N초 전 시세". 판정은 앱과 같은 공용 훅이 한다.
 * 보조 기술에는 끊긴 순간 고정 문구만 한 번 알리고, 매초 바뀌는 숫자는 읽지 않게 한다(watchlist.md §4)
 */
export function StaleNotice({ className }: { className?: string }) {
  const { stale, secondsAgo } = useQuoteFreshness();
  if (!stale) return null;
  return (
    <p className={className}>
      <output className="visually-hidden">
        시세 연결이 끊겨 마지막 값을 보여 줍니다
      </output>
      {secondsAgo !== null && (
        <span aria-hidden="true">{secondsAgo}초 전 시세</span>
      )}
    </p>
  );
}
