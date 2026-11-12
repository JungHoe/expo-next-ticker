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

/** 상세 머리: 티커·종목명, 현재가(이 화면의 주인공), 오늘 0시 대비 등락. 차트·기간·수치는 #15 */
export function QuoteHeader({
  ticker,
  name,
}: {
  ticker: string;
  name: string;
}) {
  const { data: quote } = useQuote(ticker);
  const tone = quote ? changeTone(quote.change) : "flat";
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
          <span className={styles[tone]}>
            {formatSigned(quote.change)} {formatPercent(quote.changePct)}
          </span>
        ) : (
          <span className={styles.changePlaceholder} />
        )}
        <span className={styles.since}>오늘 0시 대비</span>
      </p>
      <StaleNotice className={styles.stale} />
    </header>
  );
}
