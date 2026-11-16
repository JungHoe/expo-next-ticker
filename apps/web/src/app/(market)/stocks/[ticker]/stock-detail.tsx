import Link from "next/link";
import { Suspense } from "react";
import styles from "./detail.module.css";
import { PriceChart } from "./price-chart";
import { QuoteFacts, QuoteHeader } from "./quote-header";

/**
 * 종목 상세 본문. 목록+상세 화면과 임베드 페이지(webview-bridge.md §2)가 같이 쓴다.
 * back: 좁은 화면의 "관심 종목" 돌아가기 링크. 임베드에는 돌아갈 목록이 없어 두지 않는다
 */
export function StockDetail({
  ticker,
  name,
  back,
}: {
  ticker: string;
  name: string;
  back: boolean;
}) {
  return (
    <article className={styles.detail}>
      {back && (
        <Link href="/" className={styles.back}>
          관심 종목
        </Link>
      )}
      <QuoteHeader ticker={ticker} name={name} />
      {/* 기간은 ?range=에서 읽는다. 미리 렌더링할 때는 주소를 모르므로 같은 크기의 자리를 먼저 보낸다 */}
      <Suspense
        fallback={
          // 실제 차트 영역과 같은 구조·높이(기간 버튼 줄 + 차트)라 아래 수치 칸이 밀리지 않는다
          <div className={styles.chartSection} aria-hidden="true">
            <div className={styles.rangesFallback} />
            <div className={styles.chartFallback} />
          </div>
        }
      >
        <PriceChart ticker={ticker} />
      </Suspense>
      <QuoteFacts ticker={ticker} />
    </article>
  );
}
