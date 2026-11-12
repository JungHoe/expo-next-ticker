import type { ReactNode } from "react";
import { MarketShell } from "./market-shell";
import { Watchlist } from "./watchlist";

/** 목록과 상세를 한 화면에(A안, watchlist.md §2). 종목을 바꿔도 목록은 다시 그려지지 않는다 */
export default function MarketLayout({ children }: { children: ReactNode }) {
  return <MarketShell watchlist={<Watchlist />}>{children}</MarketShell>;
}
