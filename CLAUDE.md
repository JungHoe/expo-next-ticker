# expo-next-ticker 작업 규칙

## 먼저 읽을 것
- `docs/design.md` — 목적·범위·반목표. 범위 밖 작업은 하지 않는다
- 앱을 건드리기 전 해당 앱의 `AGENTS.md` — Next.js 16·Expo SDK 58의 API는 학습 데이터와 다를 수 있으므로 문서를 확인하고 쓴다

## 작업 흐름
1. **spec 먼저**: 기능마다 `docs/spec/<기능>.md`를 `_template.md`로 쓴다. 수용 기준이 없는 기능은 구현하지 않는다 — 구현의 정답이 spec에 있어야 AI 산출물을 판정할 수 있다
2. **이슈**: spec의 수용 기준을 GitHub 이슈로 쪼갠다. 라벨 `type:*`·`area:*` 1개 이상, 마일스톤 `v1`. 이슈 1개 = PR 1개 = 한 번에 리뷰할 수 있는 크기
3. **브랜치**: `<type>/<이슈번호>-<slug>` (예: `feat/12-watchlist`)
4. **커밋**: `<type>(<scope>): <내용> (#이슈)` — type은 feat·fix·perf·refactor·docs·chore·test, scope는 web·mobile·tokens·market·ci
5. **PR**: 템플릿을 채우고 본문에 `Closes #n`. push 전에 `pnpm check` 통과. squash merge
6. **AI가 틀린 지점**: 타입·lint·테스트·리뷰·화면 확인이 AI 코드의 잘못을 잡았으면 PR에 `ai-miss` 라벨을 달고 `docs/ai-log.md`에 한 줄 남긴다(무엇을 틀렸나 / 무엇이 잡았나 / 다시 안 생기게 무엇을 바꿨나). 이 기록이 프로젝트의 핵심 산출물이다
7. **성능**: `type:perf` 이슈 본문에 측정 방법과 개선 전 수치, PR에 개선 후 수치를 적는다. 개선 전 수치를 만들려고 일부러 느린 코드를 쓰지 않는다

## 구조와 경계
- `apps/web` Next.js App Router / `apps/mobile` Expo Router / `packages/*` 공유 코드
- 앱끼리 직접 import하지 않는다. 공유할 것은 `packages/`로 옮긴다
- `packages/*`는 플랫폼 중립: React Native·DOM API를 import하지 않는다 — 웹과 앱이 같은 코드를 그대로 쓰기 위해
- 모바일은 **Expo Go에 포함된 네이티브 모듈만** 쓴다. 의존성을 추가하기 전에 Expo Go 지원 여부를 확인하고, config plugin이나 커스텀 네이티브 모듈이 필요한 라이브러리는 쓰지 않는다 — 면접관이 Expo Go로 열어 봐야 한다

## 금지
- API 키·토큰 커밋. 비밀값은 `.env*.local`과 Vercel·EAS 환경 변수로만 다룬다
- 특정 회사 서비스의 이름·화면·데이터 모방, 다른 회사 코드 복사
- `main` 직접 커밋, `--no-verify`

## 명령
| 목적 | 명령 |
|---|---|
| 설치 | `pnpm install` |
| 전체 검사 (push 전 필수) | `pnpm check` (lint + typecheck + test) |
| 포맷·lint 자동 수정 | `pnpm biome check --write .` |
| 웹 개발 서버 / 빌드 | `pnpm --filter web dev` / `pnpm --filter web build` |
| 앱 개발 서버 (Expo Go) | `pnpm --filter mobile start` |
| 앱 번들 확인 | `pnpm --filter mobile exec expo export --platform android` |
| 앱 의존성 추가 | `pnpm --filter mobile exec expo install <패키지>` (SDK에 맞는 버전으로 고정) |

- Node 22 이상, pnpm 12
- 도구 CLI(expo, eas 등)는 `npx`가 아니라 `pnpm --filter <앱> exec <cli>`로 실행한다. 필요한 CLI는 해당 앱의 devDependency로 두어 버전을 lockfile에 고정한다 — 문서가 `npx`로 안내해도 pnpm으로 바꿔 쓴다
