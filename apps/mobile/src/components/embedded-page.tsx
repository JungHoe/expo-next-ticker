import { isSameOrigin, messageEventScript } from "@ticker/bridge";
import { useImperativeHandle, useRef } from "react";
import { Linking } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { useTheme } from "../lib/theme";
import type { EmbeddedPageProps } from "./embedded-page.types";

/**
 * 네이티브 WebView(webview-bridge.md §3 전달 경로).
 * - 앱 → 웹: injectJavaScript로 페이지 window에 message 이벤트(ref의 postMessage는 도착 위치가 문서에 없다)
 * - 웹 → 앱: window.ReactNativeWebView.postMessage → onMessage의 nativeEvent.data
 * - 출처: 웹 출처 밖으로의 이동은 막고 기기 브라우저로 연다. 메시지는 보낸 프레임의 주소(nativeEvent.url)가
 *   웹 출처일 때만 받는다. 이동을 막아도 다른 출처의 iframe은 메시지를 보낼 수 있기 때문이다(#32 리뷰).
 *   react-native-webview 14.0.1 소스: Android는 보낸 프레임의 출처(RNCWebView.java onPostMessage의 sourceOrigin),
 *   iOS는 보낸 프레임의 주소(RNCWebViewImpl.m message.frameInfo.request.URL)를 url에 넣는다.
 *   단 WEB_MESSAGE_LISTENER가 없는 구형 Android WebView는 최상위 문서 주소(getUrl())를 넣어 iframe을 구분하지 못한다
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
        if (url === "about:blank" || isSameOrigin(url, origin)) return true;
        Linking.openURL(url).catch(() => {});
        return false;
      }}
      onMessage={({ nativeEvent }: WebViewMessageEvent) => {
        if (isSameOrigin(nativeEvent.url, origin)) onMessage(nativeEvent.data);
      }}
      onError={onLoadError}
      onHttpError={onLoadError}
      // 웹 콘텐츠 프로세스가 끝나면(iOS)·렌더 프로세스가 죽으면(Android) 빈 화면 대신 오류로 알린다.
      // 죽은 WebView는 다시 그릴 수 없어 오류 화면으로 바꿔 내리고 "다시 시도"로 새로 띄운다.
      // (앱 종료는 라이브러리가 막는다: 14.0.1 RNCWebViewClient.onRenderProcessGone이 API 26 이상에서 늘 true)
      onContentProcessDidTerminate={onLoadError}
      onRenderProcessGone={onLoadError}
      // 불러오는 동안 흰 바탕이 번쩍이지 않게 앱 종이색을 깐다
      style={{ flex: 1, backgroundColor: colors.paper }}
    />
  );
}
