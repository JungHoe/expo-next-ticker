# AI가 틀린 지점

AI가 쓴 코드의 잘못을 장치(타입·lint·테스트·리뷰·화면 확인)가 잡은 기록. 새 항목은 위에 추가한다.

| 날짜 | 이슈·PR | AI가 틀린 것 | 잡은 장치 | 재발 방지로 바꾼 것 |
|---|---|---|---|---|
| 2026-11-07 | #2 · #3 | Expo 템플릿 `AGENTS.md`의 안내를 그대로 따라, pnpm 워크스페이스에서 버전이 고정되지 않는 `npx eas-cli@latest`로 EAS 로그인을 안내함 | 리뷰(사용자) | `CLAUDE.md`·`apps/mobile/AGENTS.md`에 "`npx` 대신 `pnpm --filter <앱> exec`" 규칙, eas-cli를 `apps/mobile` devDependency로 고정 |
