import { findTicker, TICKERS } from "@ticker/market";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { stockMetadata } from "../../../stock-metadata";
import styles from "./detail.module.css";
import { PriceChart } from "./price-chart";
import { QuoteFacts, QuoteHeader } from "./quote-header";

/**
 * 고정 목록 10종목은 빌드 때 만든다. Cache Components에서는 dynamicParams를 쓸 수 없으므로
 * 목록에 없는 티커는 여기서 notFound()로 404를 낸다(Next.js 16 문서 dynamicParams.md)
 */
export function generateStaticParams() {
  return TICKERS.map((ticker) => ({ ticker: ticker.symbol }));
}

/** 종목명은 고정 목록에서 온다. 요청·시각에 따라 바뀌지 않으므로 미리 렌더링한 HTML에 들어간다 */
export async function generateMetadata({
  params,
}: PageProps<"/stocks/[ticker]">): Promise<Metadata> {
  const listed = findTicker((await params).ticker);
  // 목록에 없는 티커는 proxy가 렌더 전에 404로 보낸다. 여기 오면 메타를 만들지 않는다
  return listed ? stockMetadata(listed) : {};
}

export default async function StockPage({
  params,
}: PageProps<"/stocks/[ticker]">) {
  const { ticker } = await params;
  const listed = findTicker(ticker);
  if (!listed) notFound();

  return (
    <article className={styles.detail}>
      <Link href="/" className={styles.back}>
        관심 종목
      </Link>
      <QuoteHeader ticker={listed.symbol} name={listed.name} />
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
        <PriceChart ticker={listed.symbol} />
      </Suspense>
      <QuoteFacts ticker={listed.symbol} />
    </article>
  );
}
