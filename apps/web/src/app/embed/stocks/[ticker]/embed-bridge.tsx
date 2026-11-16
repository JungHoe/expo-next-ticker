"use client";

import {
  decodeToWeb,
  encodeToApp,
  type Theme,
  type ToAppMessage,
} from "@ticker/bridge";
import { parseHistoryRange } from "@ticker/market";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

type AppWindow = Window & {
  /** react-native-webview가 onMessage가 있을 때 넣는다 */
  ReactNativeWebView?: { postMessage(data: string): void };
};

/**
 * 받는 쪽을 WebView → 부모 창(앱 웹 미리보기의 iframe) 순서로 찾는다. 브라우저에서 바로 열었으면 보내지 않는다.
 * 부모 창 출처는 미리 알 수 없어 "*"로 보낸다. 내용은 공개된 상태(티커·테마·기간)뿐이다(webview-bridge.md §3)
 */
function sendToApp(message: ToAppMessage) {
  const data = encodeToApp(message);
  const native = (window as AppWindow).ReactNativeWebView;
  if (native) native.postMessage(data);
  else if (window.parent !== window) window.parent.postMessage(data, "*");
}

/** 지금 적용된 테마: 앱이 정한 data-theme, 없으면 기기 설정 */
function appliedTheme(): Theme {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * 임베드 페이지의 메시지 연결(webview-bridge.md §3, §4). 화면에 그리는 것은 없다.
 * - 앱 → 웹 theme: 새로고침 없이 <html data-theme>만 바꾼다. 출처는 따지지 않는다(바뀌는 것은 색뿐, 값은 스키마로 거른다)
 * - 웹 → 앱: 하이드레이션 뒤 ready 한 번, 그 뒤 기간이 바뀌면 range
 */
export function EmbedBridge({ ticker }: { ticker: string }) {
  const range = parseHistoryRange(useSearchParams().get("range"));
  const sent = useRef<string | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = decodeToWeb(event.data);
      if (message?.type === "theme") {
        document.documentElement.dataset.theme = message.theme;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // 리스너를 단 뒤에 ready를 보낸다(위 effect가 먼저 실행된다). 앱은 ready를 받고 바로 테마를 보낼 수 있다
  useEffect(() => {
    if (sent.current === null) {
      sendToApp({ type: "ready", ticker, theme: appliedTheme(), range });
    } else if (sent.current !== range) {
      sendToApp({ type: "range", range });
    }
    sent.current = range;
  }, [ticker, range]);

  return null;
}
