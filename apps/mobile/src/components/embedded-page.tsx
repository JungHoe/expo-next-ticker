import { messageEventScript, originOf } from "@ticker/bridge";
import { useImperativeHandle, useRef } from "react";
import { Linking } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useTheme } from "../lib/theme";
import type { EmbeddedPageProps } from "./embedded-page.types";

/**
 * 네이티브 WebView(webview-bridge.md §3 전달 경로).
 * - 앱 → 웹: injectJavaScript로 페이지 window에 message 이벤트(ref의 postMessage는 도착 위치가 문서에 없다)
 * - 웹 → 앱: window.ReactNativeWebView.postMessage → onMessage의 nativeEvent.data(문서가 보장하는 필드는 data뿐)
 * - 출처: 웹 출처 밖으로의 이동은 막고 기기 브라우저로 연다. 그래서 받는 메시지는 웹 출처의 페이지에서만 온다
 */
export function EmbeddedPage({
  uri,
  origin,
  onMessage,
  onLoadError,
  ref,
}: EmbeddedPageProps) {
  // index.d.ts의 기본 제네릭 P = undefined는 props를 WebViewProps & undefined = never로 만든다.
  // 추가 props가 없다는 뜻으로 object를 명시한다(react-native-webview 14.0.1 + TypeScript 6)
  const webView = useRef<WebView<object>>(null);
  const { colors } = useTheme();

  useImperativeHandle(
    ref,
    () => ({
      post: (data) =>
        webView.current?.injectJavaScript(messageEventScript(data)),
    }),
    [],
  );

  return (
    <WebView<object>
      ref={webView}
      source={{ uri }}
      // 이 목록 밖의 주소는 라이브러리가 OS에 넘긴다(기기 브라우저). 목록은 접두어로 비교하므로
      // (…vercel.app.example.com도 통과) 아래에서 출처가 정확히 같은지 다시 본다
      originWhitelist={[origin]}
      onShouldStartLoadWithRequest={({ url }: ShouldStartLoadRequest) => {
        if (url === "about:blank" || originOf(url) === origin) return true;
        Linking.openURL(url).catch(() => {});
        return false;
      }}
      onMessage={(event: WebViewMessageEvent) =>
        onMessage(event.nativeEvent.data)
      }
      onError={onLoadError}
      onHttpError={onLoadError}
      // 웹 콘텐츠 프로세스가 끝나면(iOS)·렌더 프로세스가 죽으면(Android) 빈 화면 대신 오류로 알린다.
      // Android는 이 처리가 없으면 앱이 같이 종료된다(react-native-webview Reference.md)
      onContentProcessDidTerminate={onLoadError}
      onRenderProcessGone={onLoadError}
      // 불러오는 동안 흰 바탕이 번쩍이지 않게 앱 종이색을 깐다
      style={{ flex: 1, backgroundColor: colors.paper }}
    />
  );
}
