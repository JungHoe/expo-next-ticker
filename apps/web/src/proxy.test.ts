// 번들 문서(proxy.md)는 unstable_doesProxyMatch를 안내하지만 설치된 16.4.5는 이전 이름만 내보낸다
// (next/dist/experimental/testing/server/index.d.ts, #29에서 확인)
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";
import nextConfig from "../next.config";
import { config, proxy } from "./proxy";

const request = (path: string) =>
  new NextRequest(new URL(path, "https://ticker.test"));

/** Next.js 업그레이드로 rewrite 동작이 바뀌면 여기서 먼저 알린다(#15 리뷰) */
describe("proxy: 목록에 없는 티커는 렌더 전에 404", () => {
  test("목록의 티커는 그대로 통과한다(쿼리와 무관)", () => {
    for (const path of [
      "/stocks/AAPL",
      "/stocks/MSFT?range=1d",
      "/embed/stocks/AAPL?theme=dark&range=1w",
    ]) {
      const res = proxy(request(path));
      expect(res.status).toBe(200);
      expect(res.headers.get("x-middleware-next")).toBe("1");
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });

  test.each([
    "/stocks/ZZZZ",
    "/stocks/aapl",
    "/stocks/%41APL",
    "/stocks/ZZZZ/opengraph-image-13qrgn",
    "/embed/stocks/ZZZZ",
    "/embed/stocks/aapl?theme=dark",
  ])("%s는 404 화면으로 rewrite하고 상태 404", (path) => {
    const res = proxy(request(path));
    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://ticker.test/_not-found",
    );
  });

  test("목록의 티커 아래 경로(OG 이미지)는 통과한다", () => {
    const res = proxy(request("/stocks/AAPL/opengraph-image-13qrgn"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  test.each([
    ["/stocks/AAPL", true],
    ["/stocks/AAPL?range=1d", true],
    ["/stocks/ZZZZ/opengraph-image-13qrgn", true],
    ["/embed/stocks/AAPL?theme=dark", true],
    ["/embed/stocks/ZZZZ", true],
    ["/embed", false],
    ["/", false],
    ["/api/quotes", false],
    ["/api/quotes/AAPL/history", false],
  ])("%s에 proxy가 걸리는가: %s", (url, expected) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig, url })).toBe(
      expected,
    );
  });
});
