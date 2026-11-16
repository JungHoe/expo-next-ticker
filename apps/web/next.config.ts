import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    /**
     * 첫 HTML에 넣는 시세 스냅샷(docs/spec/seo-isr.md §7). 방문이 있으면 1분마다 다시 만들고, 5분 넘게 방문이
     * 없으면 다음 요청이 새로 만든다. expire가 5분보다 짧으면 미리 렌더링에서 빠져 ISR이 아니게 되고,
     * stale이 5분보다 짧으면 App Shell에서 빠진다(Next.js 16 문서 04-functions/cacheLife.md "Prerendering behavior")
     */
    snapshot: { stale: 300, revalidate: 60, expire: 300 },
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
