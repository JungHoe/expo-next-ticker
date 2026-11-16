import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    /**
     * 첫 HTML에 넣는 시세 스냅샷(docs/spec/seo-isr.md §7). 방문이 있으면 1분마다 뒤에서 다시 만든다. 하루 동안은
     * 방문이 뜸해도 캐시된 페이지를 바로 주고 뒤에서 다시 만든다(스냅샷은 브라우저에서 곧 지금 값으로 바뀌므로
     * 값의 신선도보다 첫 응답 속도가 중요하다, #30 리뷰). expire가 5분보다 짧으면 미리 렌더링에서 빠져 ISR이 아니게
     * 되고, stale이 5분보다 짧으면 App Shell에서 빠진다(Next.js 16 문서 04-functions/cacheLife.md "Prerendering behavior")
     */
    snapshot: { stale: 300, revalidate: 60, expire: 86_400 },
  },
  // 시세 API는 인증·쿠키 없는 공개 GET이다. Expo 웹 미리보기(다른 출처)도 읽을 수 있게 연다
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;
