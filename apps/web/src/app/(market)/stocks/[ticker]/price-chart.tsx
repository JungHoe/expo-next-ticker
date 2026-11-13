"use client";

import {
  chartGeometry,
  LAST_POINT_RADIUS,
  CHART_MARGIN as MARGIN,
  referenceLabelY,
  xLabelAnchor,
} from "@ticker/chart";
import {
  changeTone,
  chartDescription,
  formatPrice,
  HISTORY_RANGE_LABEL,
  HISTORY_RANGES,
  type HistoryRange,
  parseHistoryRange,
} from "@ticker/market";
import { useHistory, useQuote, withLivePoint } from "@ticker/market/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./detail.module.css";

/** 컨테이너 크기를 잰다. 차트를 실제 픽셀로 계산해야 휴대폰에서도 글자가 작아지지 않는다 */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  // 첫 그림 전에 한 번 재서 첫 프레임부터 차트를 그린다. 이후 변화는 observer가 맡는다(#15 리뷰)
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export function PriceChart({ ticker }: { ticker: string }) {
  // 기간은 주소에 둔다: 새로고침·공유해도 같은 기간이 열린다(stock-detail.md §3)
  const range = parseHistoryRange(useSearchParams().get("range"));
  return (
    <section className={styles.chartSection} aria-label="가격 차트">
      <nav className={styles.ranges} aria-label="기간">
        {HISTORY_RANGES.map((value) => (
          <Link
            key={value}
            href={`?range=${value}`}
            replace
            scroll={false}
            className={styles.range}
            aria-current={value === range ? "true" : undefined}
          >
            {HISTORY_RANGE_LABEL[value]}
          </Link>
        ))}
      </nav>
      <Chart ticker={ticker} range={range} />
    </section>
  );
}

function Chart({ ticker, range }: { ticker: string; range: HistoryRange }) {
  const history = useHistory(ticker, range);
  const { data: quote } = useQuote(ticker);
  const [frameRef, size] = useSize<HTMLDivElement>();

  const points = useMemo(() => {
    const base = history.data?.points ?? [];
    // 1시간 차트는 폴링한 최신 시세를 이어 붙여 매초 움직인다
    return range === "1h" ? withLivePoint(base, quote) : base;
  }, [history.data, quote, range]);

  const plotWidth = size
    ? Math.max(0, size.width - MARGIN.left - MARGIN.right)
    : 0;
  const plotHeight = size
    ? Math.max(0, size.height - MARGIN.top - MARGIN.bottom)
    : 0;
  const plot = size ? { width: plotWidth, height: plotHeight } : null;
  const base = quote?.base;
  // 매초 다시 그리므로 점·크기·기준가가 바뀔 때만 다시 계산한다(#10 리뷰)
  const geometry = useMemo(
    () =>
      plotWidth > 0
        ? chartGeometry({
            points,
            width: plotWidth,
            height: plotHeight,
            reference: base,
          })
        : null,
    [points, plotWidth, plotHeight, base],
  );

  const last = points.at(-1);
  const tone =
    quote && last ? changeTone(last.p - quote.base) : ("flat" as const);
  // 기간을 바꾸는 동안에는 이전 기간의 그림이라 새 기간 이름으로 설명하지 않는다(#15 리뷰)
  const description = history.isPlaceholderData
    ? "차트를 불러오는 중"
    : chartDescription(ticker, range, points);

  return (
    <div
      ref={frameRef}
      className={styles.chart}
      data-switching={history.isPlaceholderData ? "true" : undefined}
      aria-busy={
        history.isPlaceholderData || !history.data ? "true" : undefined
      }
    >
      {history.isError && !history.data ? (
        <div className={styles.chartMessage}>
          <p role="alert">차트를 불러오지 못했습니다</p>
          <button
            type="button"
            className={styles.button}
            onClick={() => history.refetch()}
          >
            다시 시도
          </button>
        </div>
      ) : history.data && !history.isPlaceholderData && points.length === 0 ? (
        <div className={styles.chartMessage}>
          <p>이 기간에 표시할 시세가 없습니다</p>
        </div>
      ) : size && plot && geometry && geometry.path ? (
        <svg
          width={size.width}
          height={size.height}
          role="img"
          aria-label={description}
          className={styles.svg}
        >
          <g transform={`translate(${MARGIN.left} ${MARGIN.top})`}>
            {geometry.yTicks.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={0}
                  x2={plot.width}
                  y1={tick.y}
                  y2={tick.y}
                  className={styles.grid}
                />
                <text
                  x={plot.width + 8}
                  y={tick.y}
                  dominantBaseline="middle"
                  className={styles.axis}
                >
                  {formatPrice(tick.value)}
                </text>
              </g>
            ))}
            {geometry.referenceY !== null && quote && (
              <g>
                <line
                  x1={0}
                  x2={plot.width}
                  y1={geometry.referenceY}
                  y2={geometry.referenceY}
                  className={styles.reference}
                />
              </g>
            )}
            {geometry.xLabels.map((label) => (
              <text
                key={label.t}
                x={label.x}
                y={plot.height + 20}
                textAnchor={xLabelAnchor(label.x, plot.width)}
                className={styles.axis}
              >
                {label.text}
              </text>
            ))}
            <path
              d={geometry.path}
              className={`${styles.line} ${styles[tone]}`}
            />
            {geometry.last && (
              <circle
                cx={geometry.last.x}
                cy={geometry.last.y}
                r={LAST_POINT_RADIUS}
                className={`${styles.lastPoint} ${styles[tone]}`}
              />
            )}
            {/* 기준가 라벨은 가격 선 위에 그린다(SVG는 나중에 그린 것이 위에 온다) */}
            {geometry.referenceY !== null && quote && (
              <text
                x={4}
                // 위쪽 경계 가까이면 선 아래에 둔다(여백 밖으로 나가지 않게)
                y={referenceLabelY(geometry.referenceY)}
                className={styles.referenceLabel}
              >
                기준가 {formatPrice(quote.base)}
              </text>
            )}
          </g>
        </svg>
      ) : null}
    </div>
  );
}
