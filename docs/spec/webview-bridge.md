# 앱 WebView 화면과 메시지 규격

- 상태: 확정
- 관련 이슈: #31, #32 (spec 작성 #28)

## 1. 목적
앱 종목 상세에서 같은 종목의 웹 페이지를 앱 안에서 연다. 앱과 웹은 정해진 메시지로 테마와 상태를 주고받고, 그래서 웹 화면이 앱의 한 화면처럼 보인다. 하이브리드 앱의 웹 통합을 보여 주는 화면이다(design.md §2 목표 4, §7).

## 2. 화면
| 플랫폼 | 화면 | 구성 |
|---|---|---|
| 웹 | `/embed/stocks/{ticker}` (임베드 페이지) | 종목 상세만 있다: 머리·기간 버튼·차트·수치는 `/stocks/{ticker}`와 같다. 상단 바, 관심 종목 목록, "관심 종목" 돌아가기 링크는 없다. 맨 아래 한 줄 "시뮬레이션 시세입니다. 실제 시세가 아닙니다"(`muted`) |
| 앱 | 종목 상세 맨 아래 "웹 페이지로 보기" 링크 | 수치 칸 아래 텍스트 링크 한 줄. 누르면 WebView 화면으로 간다 |
| 앱 | WebView 화면 `/web/{ticker}` | 스택 헤더(제목 "AAPL 웹 페이지", 뒤로 가기)와 남은 영역 전체를 채우는 WebView. 웹이 준비될 때까지 WebView 위에 앱이 그린 로딩 문구 |
| 앱(웹 미리보기) | 같음 | WebView 대신 `<iframe>`. `react-native-webview`는 웹 플랫폼을 지원하지 않는다 |

## 3. 데이터
### 메시지 규격
- 위치: `packages/bridge`(`@ticker/bridge`). Zod 스키마와 `encode`·`decode`만 있다. DOM·React Native API를 쓰지 않는다
- 메시지는 JSON 문자열이다. 웹→앱 방향이 문자열만 받기 때문이다. 모든 메시지에 `ns: "ticker"`, `v: 1`이 붙는다

| 방향 | `type` | 필드 | 언제 |
|---|---|---|---|
| 앱 → 웹 | `theme` | `theme: "light" \| "dark"` | 앱 테마가 바뀔 때 |
| 웹 → 앱 | `ready` | `ticker`, `theme`(웹이 적용한 테마), `range` | 임베드 페이지가 하이드레이션된 뒤 한 번 |
| 웹 → 앱 | `range` | `range: "1h" \| "1d" \| "1w" \| "1m"` | 웹에서 기간을 바꿨을 때 |

- `decode`는 모르는 `type`, 다른 `ns`·`v`, JSON이 아닌 문자열, 필드가 틀린 메시지에 `null`을 돌려준다. 받는 쪽은 `null`을 조용히 무시하고 예외를 던지지 않는다
- `range` 값은 `@ticker/market`의 `HistoryRangeSchema`를 쓰고, 테마 값은 `@ticker/tokens`의 모드 이름과 같다

### 처음 테마
- 앱이 주소에 `?theme=light|dark`를 붙인다. 웹 루트 `<head>`의 작은 인라인 스크립트가 그리기 전에 `<html data-theme>`를 정한다. 이 스크립트는 `/embed/` 경로에서만 동작한다
- 토큰 CSS(`cssVariables()`)는 `data-theme`이 있으면 기기 설정보다 그 값을 따른다. 없으면 지금처럼 `prefers-color-scheme`을 따른다

### 전달 경로
| | 네이티브(WebView) | 웹 미리보기(iframe) |
|---|---|---|
| 앱 → 웹 | `injectJavaScript`로 페이지 `window`에 `message` 이벤트를 보낸다 | `iframe.contentWindow.postMessage(문자열, 웹 출처)` |
| 웹 → 앱 | `window.ReactNativeWebView.postMessage(문자열)` → `onMessage`의 `nativeEvent.data` | `window.parent.postMessage(문자열, "*")` → 앱이 `event.origin`이 웹 출처이고 `event.source`가 그 iframe인지 확인한다 |

- 웹은 받을 때 두 경로 모두 `window`의 `message` 이벤트 하나로 듣는다. 보낼 때는 `ReactNativeWebView` → 부모 창 순서로 찾는다. 둘 다 없으면(브라우저에서 바로 연 경우) 보내지 않는다
- 웹 출처: 앱의 `EXPO_PUBLIC_API_BASE_URL` 또는 운영 주소다. 시세 API와 같은 출처를 쓴다(`apps/mobile/src/lib/market.ts`)

## 4. 동작 규칙
| 상태 | 웹(임베드) | 앱(WebView 화면) |
|---|---|---|
| 로딩 | 상세와 같다(ISR 스냅샷, `seo-isr.md`) | `ready`를 받을 때까지 WebView 위에 "웹 페이지를 불러오는 중"(앱 색·글꼴). 받으면 걷는다 |
| 오류 | 상세와 같다(시세 오류 규칙) | 불러오기 실패(`onError`), HTTP 오류(`onHttpError`), 15초 안에 `ready`가 오지 않는 경우: "웹 페이지를 열지 못했습니다"와 "다시 시도". 다시 시도는 앱이 아는 마지막 기간으로 주소를 다시 만들어 연다 |
| 테마 | 처음에는 `?theme=`를 쓰고, 그 뒤에는 `theme` 메시지로 새로고침 없이 색만 바꾼다 | 기기 테마가 바뀌면 `theme` 메시지를 보낸다 |
| 기간 | 기간 버튼은 그대로(`?range=`)이고, 바꾸면 `range` 메시지를 보낸다 | 처음에는 앱 상세에서 고른 기간으로 연다(`?range=`). 받은 기간을 화면 파라미터에 둔다(`router.setParams`). 헤더 제목에 반영한다("AAPL 웹 페이지 · 1일"). WebView는 다시 불러오지 않는다 |
| 이동 | 임베드 페이지는 다른 주소로 가는 링크를 두지 않는다 | 웹 출처 밖으로 가는 이동은 WebView 안에서 막고 기기 브라우저로 연다 |
| 없는 티커 | 404 | 앱 종목 상세와 같이 "목록에 없는 종목입니다"(WebView를 열지 않는다) |
| 장 마감 시간 | 해당 없음(24시간 시뮬레이션) | 해당 없음 |

- 앱이 받는 메시지는 웹 출처의 페이지에서만 온다. 네이티브에서는 WebView가 웹 출처 밖으로 가지 않게 막아서 보장하고, iframe에서는 `origin`·`source`로 확인한다
- 웹이 받는 `theme` 메시지는 출처를 따지지 않는다. 바꿀 수 있는 것이 색뿐이고 값은 스키마로 거른다

## 5. 수용 기준
앱 WebView 화면은 Expo 웹 미리보기(iframe)로 메시지 왕복까지 확인한다. **(기기)** 표시 기준은 네이티브 WebView 경로라 #4와 함께 몰아서 확인한다.

- [ ] `@ticker/bridge`: `encode`→`decode` 왕복, 모르는 `type`·다른 `v`·JSON 아님·필드 오류에서 `null`을 단위 테스트로 확인한다
- [ ] 웹 `/embed/stocks/AAPL`: 상세만 보이고 상단 바·목록·돌아가기 링크가 없다. 맨 아래 시뮬레이션 고지가 있다. 375px에서 넘치는 요소가 없다
- [ ] 웹 `/embed/stocks/AAPL?theme=dark`: 기기 설정이 라이트여도 첫 화면부터 다크다(깜빡임 없음). `theme` 메시지를 받으면 새로고침 없이 바뀐다
- [ ] 웹 `/embed/stocks/ZZZZ`는 404, `/embed/stocks/AAPL`에도 `robots noindex`가 있고 canonical은 `/stocks/AAPL`이다
- [ ] 웹 `/stocks/AAPL`(임베드 아님)은 상단 바·목록이 그대로이고 `?theme=`를 무시한다
- [ ] 앱 상세 아래 "웹 페이지로 보기" → WebView 화면에서 웹 상세가 열리고, 로딩 문구가 `ready`를 받은 뒤 사라진다
- [ ] 앱(웹 미리보기): 웹 안에서 기간을 1일로 바꾸면 앱 헤더가 "AAPL 웹 페이지 · 1일"이 된다(웹→앱)
- [ ] 앱(웹 미리보기): 앱 테마가 바뀌면 iframe 안 웹이 같은 테마로 바뀐다(앱→웹)
- [ ] 앱: 웹 서버가 없으면 15초 안에 오류 안내와 "다시 시도"가 나온다
- [ ] **(기기)** 안드로이드 Expo Go에서 같은 왕복(테마·기간·ready)이 동작하고, 웹 출처 밖 링크는 기기 브라우저로 열린다
- [ ] 웹 `/embed/stocks/AAPL`이 Hallmark `sloplint --scope app` FAIL 0이다

## 6. 범위 밖
- WebView 안에서 로그인·쿠키·인증 토큰 전달
- 웹 → 앱 화면 이동 요청(예: 다른 종목 열기). 임베드 페이지에는 이동할 곳이 없다
- 앱 상세와 WebView 화면의 기간 동기화(두 화면은 각자 기간을 가진다)
- iOS 실기기(Expo Go SDK 58을 쓸 수 없다, design.md §1)
- WebView 성능 측정(5일차)

## 7. 결정 기록
- **임베드 주소를 경로로**(설계자 판단, design.md §7의 `?embed=1`은 예시였다): `/embed/stocks/{ticker}` 경로를 쓴다. 레이아웃은 `searchParams`를 읽을 수 없어 `?embed=1`로는 상단 바·목록을 숨길 수 없다. 또 페이지에서 `searchParams`를 읽으면 그 부분이 요청 시점 렌더가 된다. 경로로 나누면 임베드 페이지도 종목별로 미리 렌더링되고 ISR 스냅샷을 그대로 쓴다. 그래서 상단 바는 루트 레이아웃에서 `(market)` 레이아웃과 404 페이지로 옮긴다
- **처음 테마를 주소로**(설계자 판단): 메시지는 하이드레이션 뒤에야 받을 수 있어, 메시지만 쓰면 첫 화면이 기기 테마로 그려졌다가 바뀐다. `injectedJavaScriptBeforeContentLoaded`는 react-native-webview 문서가 Android에서 "not 100% reliable"이라고 한다(Reference.md). 주소 + 인라인 스크립트는 네이티브·iframe 모두에서 같게 동작한다
- **앱 → 웹은 `injectJavaScript`로 `message` 이벤트를 보냄**(설계자 판단): ref의 `postMessage`가 페이지의 어디(`window`/`document`)에 도착하는지 react-native-webview 문서에 없다. 문서가 런타임 주입 방법으로 안내하는 `injectJavaScript`로 `window`에 이벤트를 보내면, iframe의 `postMessage`와 같은 리스너 하나로 받을 수 있다
- **웹 → 앱 출처 확인을 이동 제한으로**(설계자 판단): `onMessage` 이벤트에서 문서가 보장하는 필드는 `data`뿐이라 보낸 쪽 주소를 믿을 수 없다. 대신 WebView가 웹 출처 밖으로 가지 않게 막는다(`originWhitelist`, `onShouldStartLoadWithRequest`). Android는 첫 로드에서 `onShouldStartLoadWithRequest`를 부르지 않지만(Reference.md), 첫 주소는 앱이 만든 웹 출처 주소다
- **웹 미리보기는 iframe**(설계자 판단): 이 저장소는 앱 화면을 Expo 웹 미리보기로 확인한다(#4 결정). react-native-webview는 웹을 지원하지 않으므로 같은 props의 `.web.tsx` 구현을 둔다. 그러면 메시지 왕복을 브라우저에서 자동으로 확인할 수 있다. 네이티브 경로는 기기에서 확인한다
- **`ready`를 기다림**(설계자 판단): WebView의 `onLoadEnd`는 HTML이 끝났다는 뜻이고 웹 앱이 메시지를 받을 준비가 됐다는 뜻은 아니다. 준비 신호를 웹이 직접 보내면 로딩 문구를 걷는 시점과 메시지 연결 확인이 하나가 된다. 15초는 Vercel 함수 콜드 스타트와 느린 모바일망을 감안한 값이다
- **`range`를 받아 쓰는 곳**(설계자 판단): 웹의 상태를 앱이 알고 있다는 것을 헤더와 "다시 시도"로 보여 준다. 앱 상세의 기간까지 맞추면 두 화면이 서로의 상태를 바꾸게 되어 범위 밖으로 둔다
- **메시지에 `ns`·`v`**(설계자 판단): 브라우저에서는 확장 프로그램·개발 도구도 `window`에 `message`를 보낸다. `ns`로 우리 메시지만 고르고, 규격을 바꿀 때 `v`로 구분한다
- **새 패키지 `@ticker/bridge`**(설계자 판단): 메시지 규격은 시세 도메인(`@ticker/market`)도 토큰도 아니다. 웹과 앱이 같은 스키마를 import해야 하므로 `packages/`에 둔다(design.md §7)
