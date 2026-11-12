import { findTicker, TICKERS } from "@ticker/market";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./detail.module.css";
import { QuoteHeader } from "./quote-header";

/**
 * 고정 목록 10종목은 빌드 때 만든다. Cache Components에서는 dynamicParams를 쓸 수 없으므로
 * 목록에 없는 티커는 여기서 notFound()로 404를 낸다(Next.js 16 문서 dynamicParams.md)
 */
export function generateStaticParams() {
  return TICKERS.map((ticker) => ({ ticker: ticker.symbol }));
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
    </article>
  );
}
