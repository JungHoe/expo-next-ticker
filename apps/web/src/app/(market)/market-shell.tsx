"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./market.module.css";

/**
 * 60rem 이상: 왼쪽 목록 + 오른쪽 상세. 미만: 종목을 골랐으면 상세만, 아니면 목록만.
 * 무엇을 골랐는지는 주소(/stocks/{ticker})가 정한다.
 */
export function MarketShell({
  watchlist,
  children,
}: {
  watchlist: ReactNode;
  children: ReactNode;
}) {
  const { ticker } = useParams<{ ticker?: string }>();
  return (
    <div className={styles.market} data-selected={ticker ? "true" : "false"}>
      <aside className={styles.list} aria-label="관심 종목">
        {watchlist}
      </aside>
      <div className={styles.detail}>{children}</div>
    </div>
  );
}
