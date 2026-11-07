# expo-next-ticker

Expo(React Native) 앱과 Next.js 웹이 **디자인 토큰과 시세 데이터 계층을 공유**하는 실시간 미국 주식 시세 모노레포입니다.

처음 써 보는 스택(Expo·Next.js)을 AI와 함께 **spec → 이슈 → PR → CI** 흐름으로 1주 안에 도입하는 과정을 공개적으로 기록합니다. AI가 틀린 코드를 어떤 장치가 잡았는지는 [`docs/ai-log.md`](docs/ai-log.md)에 이슈·PR 링크와 함께 남깁니다.

## 바로 보기

### 웹 (Vercel)
https://expo-next-ticker.vercel.app

### 앱 (Expo Go)

<img src="https://qr.expo.dev/eas-update?projectId=5735726e-d549-4339-bae6-109c3302db76&runtimeVersion=1.0.0&channel=main" width="160" alt="Expo Go로 여는 QR 코드">

- SDK 58용 Expo Go로 QR을 스캔합니다. Expo Go는 [expo.dev/go](https://expo.dev/go)에서 SDK 58을 골라 받습니다(Play 스토어 버전은 최신 SDK보다 늦을 수 있습니다)
- 링크: `exp://u.expo.dev/5735726e-d549-4339-bae6-109c3302db76?runtime-version=1.0.0&channel-name=main`
- 대상은 안드로이드 실기기와 iOS 시뮬레이터입니다. 기기에서 열리는지 확인하는 작업은 [#4](../../issues/4)에서 합니다
- **아이폰 실기기에서는 열 수 없습니다.** App Store의 Expo Go가 SDK 54에서 멈췄기 때문입니다([Expo 문서](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/))

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

Node 22 이상, pnpm 12.
