"use client";

import {
  changeTone,
  formatPercent,
  formatPrice,
  type Quote,
  quoteLabel,
  TICKERS,
} from "@ticker/market";
import { useQuotes } from "@ticker/market/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StaleNotice } from "./freshness";
import styles from "./market.module.css";

export function Watchlist() {
  const { data, isError, fetchStatus, refetch } = useQuotes();
  const { ticker: selected } = useParams<{ ticker?: string }>();

  return (
    <section className={styles.watchlist} aria-labelledby="watchlist-title">
      <header className={styles.listHead}>
        <h2 id="watchlist-title" className={styles.listTitle}>
          관심 종목
        </h2>
        <StaleNotice className={styles.stale} />
      </header>

      <div className={styles.columns} aria-hidden="true">
        <span>종목</span>
        <span className={styles.num}>현재가</span>
        <span className={styles.num}>등락률</span>
      </div>

      {data ? (
        <ol className={styles.rows}>
          {data.quotes.map((quote) => (
            <Row
              key={quote.ticker}
              quote={quote}
              selected={quote.ticker === selected}
            />
          ))}
        </ol>
      ) : fetchStatus === "paused" ? (
        <Message text="오프라인입니다. 연결되면 다시 받습니다" />
      ) : isError ? (
        <Message
          text="시세를 불러오지 못했습니다"
          // 폴링이 1초마다 다시 받지만, 바로 다시 받을 수 있는 버튼을 둔다. 라벨은 고정한다(바뀌면 다시 읽힌다)
          action={{ label: "다시 시도", onPress: () => refetch() }}
        />
      ) : (
        <Skeleton />
      )}
    </section>
  );
}

function Row({ quote, selected }: { quote: Quote; selected: boolean }) {
  // 목록은 등락률을 보여 주므로 색도 보이는 등락률로 정한다(-0.01이 0.00%면 보합)
  const tone = changeTone(quote.changePct);
  return (
    <li>
      <Link
        href={`/stocks/${quote.ticker}`}
        className={styles.row}
        aria-label={quoteLabel(quote)}
        aria-current={selected ? "page" : undefined}
      >
        <span className={styles.symbol}>
          <span className={styles.ticker}>{quote.ticker}</span>
          <span className={styles.name}>{quote.name}</span>
        </span>
        <span className={styles.num}>{formatPrice(quote.price)}</span>
        <span className={`${styles.num} ${styles[tone]}`}>
          {formatPercent(quote.changePct)}
        </span>
      </Link>
    </li>
  );
}

/** 실제 행과 같은 높이·칸이라 값이 들어와도 레이아웃이 밀리지 않는다 */
function Skeleton() {
  return (
    <ol className={styles.rows} aria-busy="true">
      <li className="visually-hidden">
        <output>시세를 불러오는 중</output>
      </li>
      {TICKERS.map((ticker) => (
        <li key={ticker.symbol} className={styles.row} aria-hidden="true">
          <span className={styles.symbol}>
            <span className={styles.ticker}>{ticker.symbol}</span>
            <span className={styles.name}>{ticker.name}</span>
          </span>
          <span className={`${styles.num} ${styles.placeholder}`} />
          <span className={`${styles.num} ${styles.placeholder}`} />
        </li>
      ))}
    </ol>
  );
}

function Message({
  text,
  action,
}: {
  text: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <div className={styles.message}>
      <p role="alert">{text}</p>
      {action && (
        <button
          type="button"
          className={styles.button}
          onClick={action.onPress}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
