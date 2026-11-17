import type { ReactNode } from "react";
import { QuotesSnapshot } from "../quotes-snapshot";
import styles from "./embed.module.css";

/**
 * 앱 WebView에 띄우는 페이지의 틀(webview-bridge.md §2). 상단 바·목록 없이 본문과 맨 아래 고지만 둔다.
 * 시뮬레이션 고지는 상단 바 대신 여기서 한다(design.md §7 "화면에 시뮬레이션 시세 표시").
 * 첫 HTML의 시세는 상세와 같은 ISR 스냅샷이 채운다(seo-isr.md §3)
 */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.embed}>
      <QuotesSnapshot>{children}</QuotesSnapshot>
      <p className={styles.notice}>
        시뮬레이션 시세입니다. 실제 시세가 아닙니다
      </p>
    </main>
  );
}
