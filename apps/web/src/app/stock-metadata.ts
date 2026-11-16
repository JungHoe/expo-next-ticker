import type { Ticker } from "@ticker/market";
import type { Metadata } from "next";

/**
 * 종목 페이지의 메타(docs/spec/seo-isr.md §2). 임베드 페이지도 같은 값을 쓰고 canonical은 상세를 가리킨다.
 * 검색 노출은 루트 레이아웃의 noindex가 막는다. 여기서는 공유 미리보기용 값만 만든다
 */
export function stockMetadata({ symbol, name }: Ticker): Metadata {
  const path = `/stocks/${symbol}`;
  const title = `${symbol} ${name} 시세`;
  const description = `${name}(${symbol})의 시뮬레이션 시세와 1시간·1일·1주·1개월 차트. 실제 시세가 아닙니다.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      // og:title에는 루트 템플릿이 붙지 않는다. 사이트 이름은 og:site_name이 맡는다
      title,
      description,
      url: path,
      siteName: "Ticker",
      locale: "ko_KR",
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}
