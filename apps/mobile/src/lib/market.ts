import NetInfo from "@react-native-community/netinfo";
import {
  focusManager,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import type { MarketApiConfig } from "@ticker/market/react";
import { AppState, Platform } from "react-native";

/** 앱은 배포된 웹의 시세 API를 부른다. 로컬 웹 서버를 쓰려면 EXPO_PUBLIC_API_BASE_URL을 준다 */
export const marketApi: MarketApiConfig = {
  baseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    "https://expo-next-ticker.vercel.app",
  fetch: (url, init) =>
    fetch(url, { signal: init?.signal as AbortSignal | undefined }),
};

export const queryClient = new QueryClient();

let connected = false;

/**
 * 네이티브에서 TanStack Query를 기기 상태에 연결한다.
 * - 백그라운드면 폴링을 멈춘다(focusManager ← AppState)
 * - 네트워크가 끊기면 재시도를 미루고, 연결되면 다시 받는다(onlineManager ← NetInfo)
 * 웹 미리보기는 TanStack의 브라우저 기본 동작(visibilitychange, online 이벤트)을 쓴다
 */
export function connectQueryToDevice() {
  if (connected || Platform.OS === "web") return;
  connected = true;
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener("change", (state) =>
      setFocused(state === "active"),
    );
    return () => subscription.remove();
  });
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
  );
}
