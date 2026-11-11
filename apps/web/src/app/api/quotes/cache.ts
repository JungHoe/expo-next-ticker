/**
 * 시세는 1초 단위로만 바뀌므로 CDN이 1초 동안 재사용해도 결과가 같다.
 * Vercel Hobby의 함수 호출 한도를 아끼려는 설정이다(docs/spec/market-data.md §7).
 */
export const QUOTE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=1, stale-while-revalidate=1";
