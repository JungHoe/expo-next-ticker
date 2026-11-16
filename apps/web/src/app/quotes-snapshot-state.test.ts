import { hydrate, QueryClient } from "@tanstack/react-query";
import { QUOTES_QUERY_KEY, quotesResponse } from "@ticker/market";
import { afterEach, describe, expect, it, vi } from "vitest";
import { snapshotState } from "./quotes-snapshot-state";

const AT = Date.UTC(2026, 10, 16, 5, 0, 0);

afterEach(() => vi.restoreAllMocks());

describe("ISR 시세 스냅샷(seo-isr.md §3)", () => {
  it("전체 시세를 목록·상세와 같은 키로, 스냅샷 시각을 dataUpdatedAt으로 넘긴다", async () => {
    const browser = new QueryClient();
    hydrate(browser, await snapshotState(AT));
    const query = browser.getQueryCache().find({ queryKey: QUOTES_QUERY_KEY });
    expect(query?.state.data).toEqual(quotesResponse([], AT).body);
    expect(query?.state.dataUpdatedAt).toBe(AT);
  });

  it("넘겨받은 쪽은 시계를 읽지 않고 바로 오래된 값으로 본다(서버 렌더 중 Date.now() 금지)", async () => {
    const state = await snapshotState(AT);
    const browser = new QueryClient();
    hydrate(browser, state);
    // 미리 렌더링에서 useQuery는 isStaleByTime으로 신선도를 본다. 여기서 Date.now()를 읽으면 빌드가 멈춘다(#30)
    const now = vi.spyOn(Date, "now");
    const query = browser.getQueryCache().find({ queryKey: QUOTES_QUERY_KEY });
    expect(query?.isStaleByTime(1_000)).toBe(true);
    expect(now).not.toHaveBeenCalled();
  });
});
