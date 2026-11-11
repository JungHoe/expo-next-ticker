/**
 * 시세는 1초 단위로만 바뀌므로 CDN이 잠깐 재사용해도 된다(응답 시점 기준이라 최대 약 2초 지연).
 * 오류는 입력만으로 정해지므로 더 오래 둔다. Vercel Hobby 함수 호출 한도를 아끼려는 설정이다
 * (docs/spec/market-data.md §7).
 */
export function cacheControlFor(status: number): string {
  return status === 200
    ? "public, max-age=0, s-maxage=1, stale-while-revalidate=1"
    : "public, max-age=0, s-maxage=60";
}
