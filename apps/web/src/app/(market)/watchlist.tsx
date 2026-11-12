"use client";

import {
  changeTone,
  formatPercent,
  formatPrice,
  type Quote,
  quoteLabel,
  secondsSince,
  TICKERS,
} from "@ticker/market";
import { useQuotes } from "@ticker/market/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./market.module.css";

/**
 * active인 동안 1초마다 현재 시각으로 다시 그린다("N초 전 시세"용).
 * 렌더 중에 Date.now()를 읽지 않는다: Cache Components는 미리 렌더링할 때 이를 막는다(#13 빌드에서 확인)
 */
function useNow(active: boolean): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function Watchlist() {
  const { data, isError, fetchStatus, dataUpdatedAt, refetch } = useQuotes();
  const { ticker: selected } = useParams<{ ticker?: string }>();
  const stale = Boolean(data) && (isError || fetchStatus === "paused");
  const now = useNow(stale);

  return (
    <section className={styles.watchlist} aria-labelledby="watchlist-title">
      <header className={styles.listHead}>
        <h2 id="watchlist-title" className={styles.listTitle}>
          관심 종목
        </h2>
        {stale && (
          <output className={styles.stale}>
            {secondsSince(dataUpdatedAt, now)}초 전 시세
          </output>
        )}
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
          action={{
            label: fetchStatus === "fetching" ? "다시 받는 중" : "다시 시도",
            // 받는 동안은 눌러도 같은 요청이 겹칠 뿐이라 막는다
            disabled: fetchStatus === "fetching",
            onPress: () => refetch(),
          }}
        />
      ) : (
        <Skeleton />
      )}
    </section>
  );
}

function Row({ quote, selected }: { quote: Quote; selected: boolean }) {
  const tone = changeTone(quote.change);
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
    <ol
      className={styles.rows}
      aria-busy="true"
      aria-label="시세를 불러오는 중"
    >
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
  action?: { label: string; disabled?: boolean; onPress: () => void };
}) {
  return (
    <div className={styles.message} role="alert">
      <p>{text}</p>
      {action && (
        <button
          type="button"
          className={styles.button}
          disabled={action.disabled}
          onClick={action.onPress}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
