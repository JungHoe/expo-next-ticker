import {
  decodeToApp,
  embedUrl,
  encodeToWeb,
  type ToAppMessage,
} from "@ticker/bridge";
import {
  findTicker,
  HISTORY_RANGE_LABEL,
  parseHistoryRange,
} from "@ticker/market";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { EmbeddedPage } from "../../components/embedded-page";
import type { EmbeddedPageHandle } from "../../components/embedded-page.types";
import { Message } from "../../components/message";
import { webOrigin } from "../../lib/market";
import { useTheme } from "../../lib/theme";

/** 이 안에 웹이 ready를 보내지 않으면 열지 못한 것으로 본다. Vercel 함수 콜드 스타트와 느린 모바일망을 감안했다 */
const READY_TIMEOUT_MS = 15_000;

type Status = "loading" | "ready" | "error";

/**
 * 같은 종목의 웹 페이지를 앱 안에서 연다(webview-bridge.md). 웹과 메시지를 주고받는다.
 * - 앱 → 웹: 처음 테마는 주소로, 그 뒤 기기 테마가 바뀌면 theme 메시지
 * - 웹 → 앱: ready면 로딩 문구를 걷고, range면 화면 파라미터에 둔다(다시 열 때 그 기간으로)
 */
export default function WebPageScreen() {
  const params = useLocalSearchParams<{ ticker: string; range?: string }>();
  const listed = findTicker(params.ticker ?? "");
  const range = parseHistoryRange(params.range);
  const { scheme, colors, fonts, space, text } = useTheme();

  const page = useRef<EmbeddedPageHandle>(null);
  const [status, setStatus] = useState<Status>("loading");
  // 주소는 열 때 한 번 정한다. 웹에서 기간을 바꿔 파라미터가 바뀌어도 WebView를 다시 불러오지 않는다
  const [attempt, setAttempt] = useState(0);
  const [uri, setUri] = useState(() =>
    listed ? embedUrl(webOrigin, listed.symbol, range, scheme) : "",
  );

  // 다시 시도하면 status가 error → loading으로 바뀌어 시간을 새로 잰다
  useEffect(() => {
    if (status !== "loading") return;
    const id = setTimeout(() => setStatus("error"), READY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [status]);

  // ready 전에는 웹에 리스너가 없을 수 있다. 그동안 테마가 바뀌었어도 ready 직후 이 effect가 지금 테마를 보낸다
  useEffect(() => {
    if (status === "ready") {
      page.current?.post(encodeToWeb({ type: "theme", theme: scheme }));
    }
  }, [scheme, status]);

  const symbol = listed?.symbol;
  const onMessage = useCallback(
    (data: string) => {
      const message: ToAppMessage | null = decodeToApp(data);
      if (!message) return;
      if (message.type === "ready") {
        if (message.ticker === symbol) setStatus("ready");
      } else {
        router.setParams({ range: message.range });
      }
    },
    [symbol],
  );

  if (!listed) {
    return (
      <>
        <Stack.Screen options={{ title: "웹 페이지" }} />
        <Message text="목록에 없는 종목입니다" />
      </>
    );
  }

  const retry = () => {
    // 앱이 아는 마지막 기간(웹이 보낸 range)으로 다시 연다. key를 바꿔 WebView를 새로 띄운다
    setUri(embedUrl(webOrigin, listed.symbol, range, scheme));
    setAttempt((value) => value + 1);
    setStatus("loading");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen
        options={{
          title: `${listed.symbol} 웹 페이지 · ${HISTORY_RANGE_LABEL[range]}`,
          headerBackTitle: listed.symbol,
        }}
      />
      {status === "error" ? (
        <Message
          text="웹 페이지를 열지 못했습니다"
          action={{ label: "다시 시도", onPress: retry }}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <EmbeddedPage
            key={attempt}
            ref={page}
            uri={uri}
            origin={webOrigin}
            onMessage={onMessage}
            onLoadError={() => setStatus("error")}
          />
          {status === "loading" && (
            <View
              accessible
              accessibilityLabel="웹 페이지를 불러오는 중"
              accessibilityState={{ busy: true }}
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.paper, padding: space.lg },
              ]}
            >
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: text.body,
                  color: colors.muted,
                }}
              >
                웹 페이지를 불러오는 중
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
