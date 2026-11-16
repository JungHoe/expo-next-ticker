import { findTicker, TICKERS } from "@ticker/market";
import { hexColors, rule } from "@ticker/tokens";
import { ImageResponse } from "next/og";

/**
 * 공유 미리보기 이미지(docs/spec/seo-isr.md §2). 빌드 때 10종목을 한 번 만들어 캐시하므로 가격은 넣지 않는다.
 * ImageResponse 기본 글꼴에 한글이 없어 라틴 글자만 쓴다. 한국어 설명은 og:description이 맡는다
 */
export const alt = "종목 티커와 이름, 시뮬레이션 시세 고지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return TICKERS.map((ticker) => ({ ticker: ticker.symbol }));
}

const color = hexColors.light;
/** 화면 상단 바의 잉크 선(rule.bar)을 이미지 크기에 맞게 키운다 */
const BAR = rule.bar * 6;

export default async function Image({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const listed = findTicker((await params).ticker);
  if (!listed) return new Response(null, { status: 404 });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px 64px",
        background: color.paper,
        borderTop: `${BAR}px solid ${color.ink}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 220,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: color.ink,
          }}
        >
          {listed.symbol}
        </div>
        <div style={{ marginTop: 24, fontSize: 64, color: color["ink-2"] }}>
          {listed.name}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: 28,
          borderTop: `${rule.bar}px solid ${color["rule-2"]}`,
          fontSize: 34,
          color: color.muted,
        }}
      >
        <span>Simulated quotes, not real prices</span>
        <span style={{ color: color.ink }}>Ticker</span>
      </div>
    </div>,
    size,
  );
}
