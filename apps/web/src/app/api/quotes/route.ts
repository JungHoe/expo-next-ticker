import { quotesResponse } from "@ticker/market";
import { connection, type NextRequest } from "next/server";
import { cacheControlFor } from "./cache";

/** GET /api/quotes?tickers=AAPL,MSFT — docs/spec/market-data.md §3 */
export async function GET(request: NextRequest) {
  // 시세는 요청 시각으로 만든다. 빌드 때 미리 렌더링되지 않게 요청을 기다린다
  await connection();
  const { status, body } = quotesResponse(
    request.nextUrl.searchParams.getAll("tickers"),
    Date.now(),
  );
  return Response.json(body, {
    status,
    headers: { "Cache-Control": cacheControlFor(status) },
  });
}
