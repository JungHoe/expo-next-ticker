import { isSameOrigin } from "@ticker/bridge";
import { useEffect, useImperativeHandle, useRef } from "react";
import type { EmbeddedPageProps } from "./embedded-page.types";

/**
 * Expo 웹 미리보기용(react-native-webview는 웹을 지원하지 않는다, webview-bridge.md §7).
 * - 앱 → 웹: iframe.contentWindow.postMessage(문자열, 웹 출처)
 * - 웹 → 앱: 부모 창의 message 이벤트. 출처(origin)와 보낸 창(source)이 이 iframe일 때만 받는다
 */
export function EmbeddedPage({
  uri,
  origin,
  onMessage,
  ref,
}: EmbeddedPageProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      post: (data) => frame.current?.contentWindow?.postMessage(data, origin),
    }),
    [origin],
  );

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (!isSameOrigin(event.origin, origin)) return;
      if (event.source !== frame.current?.contentWindow) return;
      if (typeof event.data === "string") onMessage(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [origin, onMessage]);

  return (
    <iframe
      ref={frame}
      src={uri}
      title="웹 페이지"
      style={{ flex: 1, width: "100%", height: "100%", border: 0 }}
    />
  );
}
