import { historyResponse } from "@ticker/market";
import { connection, type NextRequest } from "next/server";
import { cacheControlFor } from "../../cache";

/** GET /api/quotes/{ticker}/history?range=1h|1d|1w|1m — docs/spec/market-data.md §3 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/quotes/[ticker]/history">,
) {
  await connection();
  const { ticker } = await ctx.params;
  const { status, body } = historyResponse(
    ticker,
    request.nextUrl.searchParams.get("range"),
    Date.now(),
  );
  return Response.json(body, {
    status,
    headers: { "Cache-Control": cacheControlFor(status) },
  });
}
