This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This repo is a pnpm 12 workspace. Never use `npx`: run CLIs with `pnpm --filter mobile exec <cli>` from the repo root (or `pnpm exec <cli>` inside `apps/mobile`), so their versions stay pinned in the lockfile. When Expo docs say `npx <cli>`, translate it.

```bash
pnpm --filter mobile exec expo install <package>  # ALWAYS use instead of pnpm add — resolves SDK-compatible versions
pnpm --filter mobile start                        # start the dev server
pnpm lint                                         # lint (Biome, repo-wide)
pnpm --filter mobile typecheck                    # typecheck
pnpm dlx expo-doctor apps/mobile                  # diagnose dependency and config issues (one-off tool)
pnpm --filter mobile exec expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. EAS CLI (`eas-cli`) is a devDependency of `apps/mobile`: run it as `pnpm --filter mobile exec eas <command>`, and substitute that for bare `eas` or `npx eas-cli` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build — which this repo does not use: the app must run in Expo Go (see the root `CLAUDE.md`), so do not add such libraries.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
