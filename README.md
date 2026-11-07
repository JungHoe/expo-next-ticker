# expo-next-ticker

Expo(React Native) 앱과 Next.js 웹이 **디자인 토큰과 시세 데이터 계층을 공유**하는 실시간 미국 주식 시세 모노레포입니다.

처음 써 보는 스택(Expo·Next.js)을 AI와 함께 **spec → 이슈 → PR → CI** 흐름으로 1주 안에 도입하는 과정을 공개적으로 기록합니다. AI가 틀린 코드를 어떤 장치가 잡았는지는 [`docs/ai-log.md`](docs/ai-log.md)에 이슈·PR 링크와 함께 남깁니다.

## 구조

```
apps/
  web/        Next.js 16 (App Router) — Vercel 배포
  mobile/     Expo SDK 58 (Expo Router) — Expo Go로 열람
packages/     공유 코드: 디자인 토큰, 시세 도메인(스키마·시뮬레이션·데이터 훅)
docs/
  design.md   목적·범위·결정 사항
  spec/       기능별 spec
```

## 작업 방식
- 규칙: [`CLAUDE.md`](CLAUDE.md)
- 설계: [`docs/design.md`](docs/design.md)
- 진행: [Issues](../../issues) · [Pull requests](../../pulls?q=is%3Apr) · 마일스톤 `v1`

## 실행

```bash
pnpm install
pnpm check                      # lint + typecheck + test
pnpm --filter web dev           # http://localhost:3000
pnpm --filter mobile start      # Expo Go로 QR 스캔
```

Node 22 이상, pnpm 11.
