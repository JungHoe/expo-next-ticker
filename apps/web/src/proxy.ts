import { findTicker } from "@ticker/market";
import { type NextRequest, NextResponse } from "next/server";

/**
 * 목록에 없는 티커는 렌더 전에 404로 돌려보낸다.
 * Cache Components에서는 페이지의 notFound()가 스트리밍 뒤에 불려 HTTP 200(soft 404)이 되기 때문이다
 * (Next.js 16 문서 04-functions/not-found.md, #13에서 확인).
 */
export function proxy(request: NextRequest) {
  const ticker = request.nextUrl.pathname.split("/")[2] ?? "";
  if (findTicker(ticker)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/_not-found", request.url), {
    status: 404,
  });
}

export const config = {
  matcher: "/stocks/:ticker",
};
