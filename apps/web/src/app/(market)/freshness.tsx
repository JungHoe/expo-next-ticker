"use client";

import { secondsSince } from "@ticker/market";
import { useQuotes } from "@ticker/market/react";
import { useEffect, useState } from "react";

/**
 * active인 동안 1초마다 현재 시각으로 다시 그린다.
 * 렌더 중에 Date.now()를 읽지 않는다: Cache Components는 미리 렌더링할 때 이를 막는다(#13 빌드에서 확인)
 */
function useNow(active: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) {
      setNow(null);
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/**
 * 값이 있다가 끊겼을 때(오류·오프라인) "N초 전 시세". 목록과 상세가 같은 요청을 보므로 같이 쓴다.
 * 보조 기술에는 끊긴 순간 고정 문구만 한 번 알리고, 매초 바뀌는 숫자는 읽지 않게 한다(watchlist.md §4)
 */
export function StaleNotice({ className }: { className?: string }) {
  const { data, isError, fetchStatus, dataUpdatedAt } = useQuotes();
  const stale = Boolean(data) && (isError || fetchStatus === "paused");
  const now = useNow(stale);
  if (!stale) return null;
  return (
    <p className={className}>
      <output className="visually-hidden">
        시세 연결이 끊겨 마지막 값을 보여 줍니다
      </output>
      {now !== null && (
        <span aria-hidden="true">
          {secondsSince(dataUpdatedAt, now)}초 전 시세
        </span>
      )}
    </p>
  );
}
