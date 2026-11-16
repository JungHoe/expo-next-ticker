import type { ReactNode } from "react";
import { QuotesSnapshot } from "../quotes-snapshot";
import { SiteFrame } from "../site-frame";
import { MarketShell } from "./market-shell";
import { Watchlist } from "./watchlist";

/**
 * 목록과 상세를 한 화면에(A안, watchlist.md §2). 종목을 바꿔도 목록은 다시 그려지지 않는다.
 * 첫 HTML의 목록·상세 시세는 ISR 스냅샷이 채운다(seo-isr.md §3)
 */
export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <SiteFrame>
      <QuotesSnapshot>
        <MarketShell watchlist={<Watchlist />}>{children}</MarketShell>
      </QuotesSnapshot>
    </SiteFrame>
  );
}
