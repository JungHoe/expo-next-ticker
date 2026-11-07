# AI가 틀린 지점

AI가 쓴 코드의 잘못을 장치(타입·lint·테스트·리뷰·화면 확인)가 잡은 기록. 새 항목은 위에 추가한다.

| 날짜 | 이슈·PR | AI가 틀린 것 | 잡은 장치 | 재발 방지로 바꾼 것 |
|---|---|---|---|---|
| 2026-11-07 | #1 · #5 | `gh pr merge`로 squash merge할 때 작성자 이메일을 지정하지 않아, 계정의 실제 이메일이 공개 저장소 `main` 이력에 들어감(#3 머지 커밋) | 리뷰(사용자의 보안 질문을 받고 커밋 이력 점검) | `main` 이력을 noreply 작성자로 고쳐 force-push, GitHub 이메일 비공개 설정, `CLAUDE.md`에 머지 시 `--author-email` 규칙 |
| 2026-11-07 | #1 · #5 | 설계(`docs/design.md` §1)가 "Expo Go로 QR을 찍어 바로 실행"을 아이폰 포함으로 가정함. App Store의 Expo Go가 SDK 54에서 멈춰 SDK 58 앱을 열 수 없다는 것을 몰랐음 | 문서 확인(`apps/mobile/AGENTS.md`의 "학습 데이터를 믿지 말고 문서를 확인한다" 규칙) | `design.md` §1·§7에 아이폰 제외와 영상 대체를 명시, README에 제약과 출처 |
| 2026-11-07 | #2 · #3 | Expo 템플릿 `AGENTS.md`의 안내를 그대로 따라, pnpm 워크스페이스에서 버전이 고정되지 않는 `npx eas-cli@latest`로 EAS 로그인을 안내함 | 리뷰(사용자) | `CLAUDE.md`·`apps/mobile/AGENTS.md`에 "`npx` 대신 `pnpm --filter <앱> exec`" 규칙, eas-cli를 `apps/mobile` devDependency로 고정 |
