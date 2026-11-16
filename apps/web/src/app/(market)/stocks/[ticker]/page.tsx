import { findTicker, TICKERS } from "@ticker/market";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stockMetadata } from "../../../stock-metadata";
import { StockDetail } from "./stock-detail";

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

  return <StockDetail ticker={listed.symbol} name={listed.name} back />;
}
