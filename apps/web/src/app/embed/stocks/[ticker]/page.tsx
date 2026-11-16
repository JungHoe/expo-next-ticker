import { findTicker, TICKERS } from "@ticker/market";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StockDetail } from "../../../(market)/stocks/[ticker]/stock-detail";
import { stockMetadata } from "../../../stock-metadata";
import { EmbedBridge } from "./embed-bridge";

/** 상세와 같이 고정 10종목을 빌드 때 만든다. 목록에 없는 티커는 proxy가 렌더 전에 404로 보낸다 */
export function generateStaticParams() {
  return TICKERS.map((ticker) => ({ ticker: ticker.symbol }));
}

/** 상세와 같은 메타. canonical·og:url은 상세(/stocks/{ticker})를 가리키고, noindex는 루트가 건다 */
export async function generateMetadata({
  params,
}: PageProps<"/embed/stocks/[ticker]">): Promise<Metadata> {
  const listed = findTicker((await params).ticker);
  return listed ? stockMetadata(listed) : {};
}

export default async function EmbedStockPage({
  params,
}: PageProps<"/embed/stocks/[ticker]">) {
  const listed = findTicker((await params).ticker);
  if (!listed) notFound();

  return (
    <>
      <StockDetail ticker={listed.symbol} name={listed.name} back={false} />
      {/* 기간을 ?range=에서 읽으므로 미리 렌더링할 때는 비워 둔다. 화면에 그리는 것은 없다 */}
      <Suspense fallback={null}>
        <EmbedBridge ticker={listed.symbol} />
      </Suspense>
    </>
  );
}
