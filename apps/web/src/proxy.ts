import { findTicker } from "@ticker/market";
import { type NextRequest, NextResponse } from "next/server";

/**
 * 목록에 없는 티커는 렌더 전에 404로 돌려보낸다.
 * Cache Components에서는 페이지의 notFound()가 스트리밍 뒤에 불려 HTTP 200(soft 404)이 되기 때문이다
 * (Next.js 16 문서 04-functions/not-found.md, #13에서 확인).
 * 임베드 페이지(/embed/stocks/{ticker}, webview-bridge.md)도 같다. 종목 아래 경로(OG 이미지 등)도 막는다. 안 막으면 지어낸 티커마다 이미지 핸들러의 404가 캐시에 쌓인다(#29 리뷰)
 */
export function proxy(request: NextRequest) {
  // /stocks/{ticker}/… 와 /embed/stocks/{ticker}/… 둘 다 "stocks" 다음 칸이 티커다
  const segments = request.nextUrl.pathname.split("/");
  const ticker = segments[segments.indexOf("stocks") + 1] ?? "";
  if (findTicker(ticker)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_not-found", request.url), {
    status: 404,
  });
}

export const config = {
  // :path*는 0개 이상이라 /stocks/AAPL 자체도 걸린다(Next.js 16 문서 03-file-conventions/proxy.md "Matcher")
  matcher: ["/stocks/:ticker/:path*", "/embed/stocks/:ticker/:path*"],
};
