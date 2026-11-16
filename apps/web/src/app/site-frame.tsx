import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./site-frame.module.css";

/**
 * 사이트 상단 바(서비스 이름 + 시뮬레이션 고지)와 본문 틀. 임베드 페이지는 이 틀 없이 상세만 그리므로
 * 루트 레이아웃이 아니라 (market) 레이아웃과 404 페이지가 쓴다(docs/spec/webview-bridge.md §7)
 */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link href="/" className={styles.mark}>
          Ticker
        </Link>
        <p className={styles.notice}>
          시뮬레이션 시세입니다. 실제 시세가 아닙니다
        </p>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
