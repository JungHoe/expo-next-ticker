"use client";

import {
  changeTone,
  formatPercent,
  formatPrice,
  formatSigned,
} from "@ticker/market";
import { useQuote } from "@ticker/market/react";
import { StaleNotice } from "../../freshness";
import styles from "./detail.module.css";

/** 상세 머리: 티커·종목명, 현재가(이 화면의 주인공), 오늘 0시 대비 등락 */
export function QuoteHeader({
  ticker,
  name,
}: {
  ticker: string;
  name: string;
}) {
  const { data: quote, isError, refetch } = useQuote(ticker);
  const tone = quote ? changeTone(quote.change) : "flat";
  if (isError && !quote) {
    return (
      <header className={styles.head}>
        <h1 className={styles.title}>
          <span className={styles.ticker}>{ticker}</span>
          <span className={styles.name}>{name}</span>
        </h1>
        <div className={styles.chartMessage}>
          <p role="alert">시세를 불러오지 못했습니다</p>
          <button
            type="button"
            className={styles.button}
            onClick={() => refetch()}
          >
            다시 시도
          </button>
        </div>
      </header>
    );
  }
  return (
    <header className={styles.head}>
      <h1 className={styles.title}>
        <span className={styles.ticker}>{ticker}</span>
        <span className={styles.name}>{name}</span>
      </h1>
      <p className={styles.price}>
        {quote ? (
          formatPrice(quote.price)
        ) : (
          <span className={styles.pricePlaceholder} />
        )}
      </p>
      <p className={styles.change}>
        {quote ? (
          <span className={`${styles.changeValue} ${styles[tone]}`}>
            {formatSigned(quote.change)} {formatPercent(quote.changePct)}
          </span>
        ) : (
          <span className={styles.changeValue}>
            <span className={styles.changePlaceholder} />
          </span>
        )}
        <span className={styles.since}>오늘 0시 대비</span>
      </p>
      <StaleNotice className={styles.stale} />
    </header>
  );
}

/** 기준가·고가·저가. 값이 오기 전에도 자리를 잡아 레이아웃이 밀리지 않는다 */
export function QuoteFacts({ ticker }: { ticker: string }) {
  const { data: quote } = useQuote(ticker);
  const facts = [
    ["기준가", quote?.base],
    ["고가", quote?.high],
    ["저가", quote?.low],
  ] as const;
  return (
    <dl className={styles.facts}>
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value === undefined ? "\u00a0" : formatPrice(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
