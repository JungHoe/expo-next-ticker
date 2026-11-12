# AI가 틀린 지점

AI가 쓴 코드의 잘못을 장치(타입·lint·테스트·리뷰·화면 확인)가 잡은 기록. 새 항목은 위에 추가한다.

| 날짜 | 이슈·PR | AI가 틀린 것 | 잡은 장치 | 재발 방지로 바꾼 것 |
|---|---|---|---|---|
| 2026-11-12 | #13 · #24 | "N초 전 시세"를 `role=status`(`<output>`)로 매초 바꿔, 끊긴 동안 스크린리더가 1초마다 읽게 만들었다. spec(`watchlist.md` §4) "초당 바뀌는 값은 알리지 않는다"를 어김. "다시 시도" 버튼 라벨도 매초 바뀌어 다시 읽혔다 | 리뷰(code-reviewer) | 끊긴 순간 고정 문구 한 번만 알리고 숫자는 `aria-hidden`, 버튼 라벨 고정. 브라우저 확인 스크립트에 "알림은 고정 문구" 확인 추가 |
| 2026-11-12 | #8 · #23 | spec(`design-tokens.md` §5)에 웹 디자인 검사 기준을 "`sloplint --url` FAIL 0"으로 적었다. 그런데 `--url` 모드는 렌더 규칙만 보고 CSS 규칙(토큰·stamp·상태)은 검사하지 않아, 템플릿 페이지도 clean으로 나온다 | 검사 도구를 알려진 나쁜 페이지(아직 템플릿인 프로덕션)로 시험 | 기준을 소스 파일 모드 + `--url --render` 두 단계로 고치고 `CLAUDE.md` 명령표에 적음. 소스 모드가 stamp 형식 오류(`/*!`)와 `:active` 누락을 잡았다 |
| 2026-11-12 | #12 · #22 | "목록+상세가 함께 보여도 초당 1회" 테스트를 두 화면이 같은 순간 구독하고 응답이 즉시 끝나는 조건으로만 썼다. 그래서 상세 진입 때 나가는 추가 요청(`staleTime` 0)과, 기본 재시도 백오프 때문에 서버 장애 표시가 약 7초 늦는 문제를 놓쳤다 | 리뷰(code-reviewer) + 요청 시각 계측 | 응답 300ms·구독 0.5초 시차 조건 테스트, `staleTime` 1초, 시세는 재시도 끔(폴링이 재시도), 이력은 확정 오류 재시도 안 함. 리뷰의 "화면마다 타이머라 초당 2회" 주장은 계측(요청 간격 1.3초로 한 박자)으로 반박되어 적용하지 않았다 |
| 2026-11-11 | #11 · #21 | 시세 API에 CORS 헤더를 넣지 않음. 앱 화면을 확인하기로 한 Expo 웹 미리보기(`localhost:8081`)는 다른 출처라 브라우저가 응답을 막는다. curl 검증으로는 드러나지 않았다 | 리뷰(별도 code-reviewer 에이전트) | `next.config`의 `headers()`로 `/api/:path*`에 CORS. 헤드리스 Chrome으로 다른 출처에서 `fetch`하는 확인을 추가해 고치기 전 `Failed to fetch` → 고친 뒤 성공을 재현 |
| 2026-11-11 | #7 리뷰 · #21 | AI 코드 리뷰어가 "워크스페이스 TS 패키지를 쓰려면 `next.config`에 `transpilePackages`가 필요하다"고 권고함(이전 Next.js 기준 지식) | 문서 확인(`apps/web/AGENTS.md`의 "번들된 Next.js 16 문서를 먼저 읽는다" 규칙) + 빌드: 문서에 "Turbopack transpiles workspace packages automatically", `transpilePackages` 없이 `next build`·`next start` 통과 | 권고를 적용하지 않고 #8 이슈에 정정 댓글. 리뷰 지시문에 "번들된 Next.js 문서와 대조한 뒤 지적하라"를 넣는다 |
| 2026-11-07 | #1 · #5 | `gh pr merge`로 squash merge할 때 작성자 이메일을 지정하지 않아, 계정의 실제 이메일이 공개 저장소 `main` 이력에 들어감(#3 머지 커밋) | 리뷰(사용자의 보안 질문을 받고 커밋 이력 점검) | `main` 이력을 noreply 작성자로 고쳐 force-push, GitHub 이메일 비공개 설정, `CLAUDE.md`에 머지 시 `--author-email` 규칙 |
| 2026-11-07 | #1 · #5 | 설계(`docs/design.md` §1)가 "Expo Go로 QR을 찍어 바로 실행"을 아이폰 포함으로 가정함. App Store의 Expo Go가 SDK 54에서 멈춰 SDK 58 앱을 열 수 없다는 것을 몰랐음 | 문서 확인(`apps/mobile/AGENTS.md`의 "학습 데이터를 믿지 말고 문서를 확인한다" 규칙) | `design.md` §1·§7에 아이폰 제외와 영상 대체를 명시, README에 제약과 출처 |
| 2026-11-07 | #2 · #3 | Expo 템플릿 `AGENTS.md`의 안내를 그대로 따라, pnpm 워크스페이스에서 버전이 고정되지 않는 `npx eas-cli@latest`로 EAS 로그인을 안내함 | 리뷰(사용자) | `CLAUDE.md`·`apps/mobile/AGENTS.md`에 "`npx` 대신 `pnpm --filter <앱> exec`" 규칙, eas-cli를 `apps/mobile` devDependency로 고정 |
