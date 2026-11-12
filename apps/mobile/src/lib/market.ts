import NetInfo from "@react-native-community/netinfo";
import {
  focusManager,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import type { MarketApiConfig } from "@ticker/market/react";
import { AppState, Platform } from "react-native";

const PRODUCTION_API = "https://expo-next-ticker.vercel.app";

/**
 * 앱은 배포된 웹의 시세 API를 부른다. 로컬 웹 서버를 쓰려면 EXPO_PUBLIC_API_BASE_URL을 준다.
 * 빈 값이면 배포 주소를 쓰고, 끝의 "/"는 뗀다("…/" + "/api"가 "//api"가 되지 않게)
 */
export const marketApi: MarketApiConfig = {
  baseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL || PRODUCTION_API).replace(
    /\/+$/,
    "",
  ),
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
    // isConnected는 처음에 null(아직 모름)이다. 모르는 동안은 온라인으로 보고 첫 요청을 막지 않는다
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
}
