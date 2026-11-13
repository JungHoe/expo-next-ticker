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
      {/* 목록 안의 section이 "관심 종목" 제목으로 이름을 가진다. 같은 이름의 랜드마크를 겹치지 않는다 */}
      <div className={styles.list}>{watchlist}</div>
      <div className={styles.detail}>{children}</div>
    </div>
  );
}
