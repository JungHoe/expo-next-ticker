import { cssVariables } from "@ticker/tokens";
import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";
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

/**
 * canonical·og:url 같은 상대 주소의 기준. 정하지 않으면 localhost로 풀린다(next lib/metadata/resolvers/resolve-url.js).
 * Vercel이 빌드 때 운영 도메인을 VERCEL_PROJECT_PRODUCTION_URL로 넣는다(docs/spec/seo-isr.md §7)
 */
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // 하위 페이지 제목 뒤에 서비스 이름을 붙인다. "/"는 default를 쓴다
  title: { default: "Ticker", template: "%s · Ticker" },
  description:
    "실제 미국 주식 티커에 시뮬레이션 시세를 붙인 Next.js·Expo 모노레포 데모",
  // 실제 종목의 가짜 시세가 검색에 잡히지 않게 한다(design.md §7)
  robots: { index: false, follow: false },
};

/**
 * 임베드 페이지는 앱이 주소로 넘긴 테마(?theme=light|dark)를 그리기 전에 적용한다(webview-bridge.md §3).
 * 다른 페이지는 기기 설정을 따른다. 하이드레이션 뒤에 바꾸면 첫 화면이 기기 테마로 그려졌다가 바뀐다
 * (Next.js 16 문서 02-guides/preventing-flash-before-hydration.md "Themes")
 */
const embedThemeScript = `(function(){try{if(location.pathname.indexOf("/embed/")!==0)return;var t=new URLSearchParams(location.search).get("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // 인라인 스크립트가 data-theme을 하이드레이션 전에 넣으므로 <html> 속성 차이는 경고하지 않는다
    <html
      lang="ko"
      className={`${display.variable} ${body.variable} ${num.variable}`}
      suppressHydrationWarning
    >
      {/* head에는 토큰 style과 테마 스크립트만 둔다. title·meta는 metadata로(Next.js 문서: head 태그를 직접 쓰지 않는다) */}
      <head>
        <style>{cssVariables()}</style>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: 고정 문자열이다. 사용자 입력이 들어가지 않는다
          dangerouslySetInnerHTML={{ __html: embedThemeScript }}
        />
      </head>
      {/* 상단 바는 페이지 종류마다 다르다: (market)·404는 SiteFrame, 임베드는 상세만 */}
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
