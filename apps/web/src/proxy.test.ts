import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";
import { config, proxy } from "./proxy";

const request = (path: string) =>
  new NextRequest(new URL(path, "https://ticker.test"));

/** Next.js 업그레이드로 rewrite 동작이 바뀌면 여기서 먼저 알린다(#15 리뷰) */
describe("proxy: 목록에 없는 티커는 렌더 전에 404", () => {
  test("목록의 티커는 그대로 통과한다(쿼리와 무관)", () => {
    for (const path of ["/stocks/AAPL", "/stocks/MSFT?range=1d"]) {
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
  ])("%s는 404 화면으로 rewrite하고 상태 404", (path) => {
    const res = proxy(request(path));
    expect(res.status).toBe(404);
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "https://ticker.test/_not-found",
    );
  });

  test("상세 경로에만 걸린다", () => {
    expect(config.matcher).toBe("/stocks/:ticker");
  });
});
