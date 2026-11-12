import { cssVariables } from "@ticker/tokens";
import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Newsreader } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import styles from "./layout.module.css";
import { Providers } from "./providers";

// 재료: Hallmark 테마 Almanac(docs/spec/design-tokens.md). 한글은 시스템 고딕이 대신 그린다
const display = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});
const body = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});
const num = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-num",
});

export const metadata: Metadata = {
  title: "Ticker",
  description:
    "실제 미국 주식 티커에 시뮬레이션 시세를 붙인 Next.js·Expo 모노레포 데모",
  // 실제 종목의 가짜 시세가 검색에 잡히지 않게 한다(design.md §7)
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${display.variable} ${body.variable} ${num.variable}`}
    >
      {/* head에는 토큰 style만 둔다. title·meta는 metadata로(Next.js 문서: head 태그를 직접 쓰지 않는다) */}
      <head>
        <style>{cssVariables()}</style>
      </head>
      <body>
        <div className={styles.shell}>
          <header className={styles.bar}>
            <Link href="/" className={styles.mark}>
              Ticker
            </Link>
            <p className={styles.notice}>
              시뮬레이션 시세입니다. 실제 시세가 아닙니다
            </p>
          </header>
          <main className={styles.main}>
            <Providers>{children}</Providers>
          </main>
        </div>
      </body>
    </html>
  );
}
