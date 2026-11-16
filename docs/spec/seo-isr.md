# 웹 종목 상세 ISR·SEO

- 상태: 확정
- 관련 이슈: #29, #30 (spec 작성 #28)

## 1. 목적
종목 페이지 링크를 열면 첫 응답 HTML부터 종목 정보와 시세가 들어 있고, 메신저·SNS에 공유하면 종목별 제목·설명·이미지 미리보기가 나온다. 실제 종목에 가짜 시세를 붙인 페이지이므로 검색에는 노출하지 않는다(design.md §7).

## 2. 화면
| 플랫폼 | 화면 | 구성 |
|---|---|---|
| 웹 | `/stocks/{ticker}`의 `<head>` | 제목 "AAPL Apple 시세 · Ticker", 설명, canonical, Open Graph(제목·설명·주소·이미지·사이트 이름·언어), 트위터 카드, `robots: noindex, nofollow` |
| 웹 | `/stocks/{ticker}/opengraph-image` | 1200×630 PNG. 종이색 바탕에 티커(가장 크게)·종목명·"Simulated quotes · Ticker". 위에 잉크색 굵은 선(상단 바와 같은 재료). 가격·차트는 넣지 않는다 |
| 웹 | `/`, `/stocks/{ticker}`의 첫 HTML | 관심 종목 표, 상세 머리(현재가·등락), 수치 칸(기준가·고가·저가)이 시세 스냅샷 값으로 차 있다. 차트는 지금처럼 뼈대(이력은 기간을 주소에서 읽으므로 브라우저에서 받는다) |
| 앱 | 해당 없음 | |

### 메타 값
| 항목 | 값 (AAPL 예) |
|---|---|
| `title` | `AAPL Apple 시세` + 루트 템플릿 `%s · Ticker` |
| `description` | `Apple(AAPL)의 시뮬레이션 시세와 1시간·1일·1주·1개월 차트. 실제 시세가 아닙니다.` |
| `alternates.canonical` | `/stocks/AAPL` |
| `openGraph` | `title`·`description` 같음, `url` `/stocks/AAPL`, `siteName` `Ticker`, `locale` `ko_KR`, `type` `website`, 이미지는 `opengraph-image` 파일 규칙이 넣는다 |
| `twitter.card` | `summary_large_image` |
| `metadataBase` | Vercel 운영 주소(`VERCEL_PROJECT_PRODUCTION_URL`), 없으면 `http://localhost:3000` |

## 3. 데이터
- 메타: `findTicker`의 고정 목록(종목명). 요청·시각에 따라 바뀌지 않는다
- 시세 스냅샷: 전체 10종목 시세 응답(`quotesResponse`, `market-data.md` §3)을 서버에서 만든다. `'use cache'` 함수 안에서 그 시각으로 만들고, `cacheLife` 프로필 `snapshot`(stale 5분, revalidate 1분, expire 5분)으로 캐시한다
- 브라우저 인계: 서버 렌더에서 `QueryClient`에 스냅샷을 넣고 `dehydrate` → `HydrationBoundary`. 쿼리 키·모양은 `quotesQueryOptions`와 같고, `dataUpdatedAt`은 스냅샷 시각이다. 그래서 브라우저는 이 값을 이미 오래된 값으로 보고 하이드레이션 직후 새로 받은 뒤 #16의 박자로 폴링을 이어 간다
- 스냅샷은 목록과 상세가 같이 쓰는 레이아웃(`(market)/layout.tsx`)에 한 번 둔다. 임베드 페이지(`webview-bridge.md`)도 같은 방식으로 넣는다

## 4. 동작 규칙
| 상태 | 웹 | 앱 |
|---|---|---|
| 첫 응답 | HTML에 스냅샷 값이 있다. 값은 최대 약 5분 전 것일 수 있고, 하이드레이션 뒤 첫 응답(보통 1초 안)에서 지금 값으로 바뀐다 | 해당 없음 |
| JS 없이 | 스냅샷 값과 종목 정보가 보인다. 차트 자리는 뼈대 | 해당 없음 |
| 로딩 | 시세 뼈대는 스냅샷이 없을 때만 보인다(정상 경로에서는 보이지 않는다) | 해당 없음 |
| 오류·재연결 | 스냅샷이 있는 채로 첫 요청이 실패하면 "값이 있었음" 규칙(마지막 값 유지 + "N초 전 시세", `watchlist.md` §4)을 따른다. N은 스냅샷 시각부터 센다 | 해당 없음 |
| 없는 티커 | 지금처럼 404. 메타·OG 이미지를 만들지 않는다 | 해당 없음 |
| 장 마감 시간 | 해당 없음(24시간 시뮬레이션) | 해당 없음 |

## 5. 수용 기준
- [ ] `/stocks/AAPL` 첫 HTML에 §2 메타 값이 모두 있다: `<title>`, description, canonical, `og:title`·`og:description`·`og:url`·`og:image`(1200×630)·`og:site_name`·`og:locale`, `twitter:card`, `robots noindex`
- [ ] 10종목의 title·description·canonical·og:url·og:image가 종목마다 다르다
- [ ] `/stocks/AAPL/opengraph-image`가 1200×630 PNG를 돌려주고, 빌드 때 10종목 모두 미리 만들어진다
- [ ] 배포본(Vercel)에서 canonical·`og:url`·`og:image`가 `https://expo-next-ticker.vercel.app/…` 절대 주소다
- [ ] `/`와 `/stocks/AAPL` 첫 HTML에 AAPL 현재가 숫자가 들어 있다(시세 뼈대가 없다). 브라우저에서 1초 안에 지금 값으로 바뀌고, 그 뒤 웹·앱 같은 박자(#16)가 유지된다
- [ ] `next build` 경로 표에서 `/stocks/[ticker]` 10개가 미리 렌더링되고 revalidate 1분, expire 5분이다
- [ ] 스냅샷으로 연 뒤 시세 요청이 실패하면 "N초 전 시세"가 나온다
- [ ] 웹 `/stocks/AAPL`이 Hallmark `sloplint --scope app` FAIL 0이다

## 6. 범위 밖
- 검색 노출(`index`), sitemap·robots.txt. noindex를 유지한다(design.md §7)
- 가격이 들어간 OG 이미지
- 목록에 없는 티커의 ISR(고정 목록이다. 404)
- 차트 이력의 서버 렌더(기간이 `?range=`에 있어 미리 렌더링할 때 모른다)
- 성능 수치(LCP·CLS) 측정은 5일차 `type:perf` 이슈에서 한다

## 7. 결정 기록
- **ISR = `'use cache'` + `cacheLife`**(설계자 판단): Cache Components에서는 Pages Router의 `revalidate`가 `'use cache'`와 `cacheLife`로 바뀌었다(번들 문서 `02-guides/incremental-static-regeneration-cache-components.md` "getStaticProps with revalidate maps to 'use cache' with cacheLife"). 고정 10종목은 이미 `generateStaticParams`로 빌드 때 만든다. 여기에 주기적으로 다시 만드는 내용을 더한다. 그 내용이 시세 스냅샷이다
- **스냅샷에 무엇을 넣나**(설계자 판단): 전체 목록 응답 하나다. 목록과 상세가 같은 쿼리 키를 쓰므로 한 번 넣으면 두 화면이 함께 찬다(`market-data.md` §3). 종목별로 따로 만들면 키가 달라져 폴링 쿼리와 합쳐지지 않는다
- **캐시 함수 안의 `Date.now()`**(설계자 판단): `CLAUDE.md`는 웹 렌더 중 `Date.now()`를 막는다. 다만 `'use cache'` 범위 안에서 읽은 시각은 결과와 함께 캐시되어 다시 만들 때까지 모두가 같은 값을 본다. 문서도 이를 해법으로 든다(`01-getting-started/08-caching.md` "Random values and timestamps": "cache the result so all users see the same value until revalidation"). 렌더 함수에서 직접 읽지 않고 캐시 함수 안에서만 읽는다
- **수명 stale 5분 / revalidate 1분 / expire 5분**(설계자 판단): 시세에 맞을 것 같은 `seconds` 프로필은 expire가 1분이라 미리 렌더링에서 빠지고 요청마다 서버가 그린다. 이것은 ISR이 아니다(`cacheLife.md` "Prerendering behavior": expire 5분 미만은 dynamic hole). revalidate 1분이면 방문이 있는 동안 1분마다 다시 만들고, expire 5분이면 5분 넘게 방문이 없을 때 다음 요청이 새로 만든다. 그래서 첫 화면 값은 최대 약 5분 전 것이다. stale을 5분으로 둔 것은 5분 미만이면 App Shell에서 빠지기 때문이다
- **오래될 수 있는 값을 보여 주는 이유**(설계자 판단): 뼈대보다 정보가 있고, 1초 안에 지금 값으로 바뀐다. JS 없는 환경과 미리보기 봇도 값을 본다. 값이 끊기면 "N초 전 시세"가 스냅샷 시각을 기준으로 정직하게 나온다
- **Vercel 한도**(설계자 판단): 다시 만들기는 방문이 있을 때만 일어난다. 경로 11개(`/`와 10종목)가 1분에 한 번씩 다시 만들어져도 함수 호출은 시세 폴링(화면 하나가 하루 8만 6천 회, `market-data.md` §7)보다 훨씬 적다
- **OG 이미지에 가격 없음**(설계자 판단): 이미지는 빌드 때 한 번 만들어 캐시하고, 메신저도 미리보기를 오래 캐시한다. 가격을 넣으면 공유된 미리보기에 틀린 값이 남는다
- **OG 이미지는 라틴 글자만**(설계자 판단): `ImageResponse` 기본 글꼴에는 한글이 없다. 한글 글꼴 파일을 저장소에 넣는 대신 티커·영문 종목명·영문 고지만 쓴다. 한국어 설명은 `og:description`이 맡는다
- **`metadataBase`를 직접 정함**(설계자 판단): 정하지 않으면 canonical·`og:url` 같은 상대 주소가 `localhost`로 풀린다(Next.js `lib/metadata/resolvers/resolve-url.js`. OG 이미지만 Vercel 주소로 대체한다). Vercel이 넣는 `VERCEL_PROJECT_PRODUCTION_URL`을 쓴다
- **noindex 유지**(지원자, design.md §7): 메타는 공유 미리보기를 위해 만들고, 검색 노출은 막는다
