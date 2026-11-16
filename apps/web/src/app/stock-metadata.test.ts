import { TICKERS } from "@ticker/market";
import { describe, expect, it } from "vitest";
import { stockMetadata } from "./stock-metadata";

describe("종목 메타(seo-isr.md §2)", () => {
  it("AAPL: 제목·설명·canonical·Open Graph·트위터 카드", () => {
    const aapl = TICKERS.find((t) => t.symbol === "AAPL");
    if (!aapl) throw new Error("AAPL이 목록에 없다");
    expect(stockMetadata(aapl)).toEqual({
      title: "AAPL Apple 시세",
      description:
        "Apple(AAPL)의 시뮬레이션 시세와 1시간·1일·1주·1개월 차트. 실제 시세가 아닙니다.",
      alternates: { canonical: "/stocks/AAPL" },
      openGraph: {
        title: "AAPL Apple 시세",
        description:
          "Apple(AAPL)의 시뮬레이션 시세와 1시간·1일·1주·1개월 차트. 실제 시세가 아닙니다.",
        url: "/stocks/AAPL",
        siteName: "Ticker",
        locale: "ko_KR",
        type: "website",
      },
      twitter: { card: "summary_large_image" },
    });
  });

  it("10종목의 제목·설명·주소가 서로 다르다", () => {
    const all = TICKERS.map(stockMetadata);
    for (const key of ["title", "description"] as const) {
      expect(new Set(all.map((m) => m[key])).size).toBe(TICKERS.length);
    }
    expect(new Set(all.map((m) => m.alternates?.canonical)).size).toBe(
      TICKERS.length,
    );
  });
});
