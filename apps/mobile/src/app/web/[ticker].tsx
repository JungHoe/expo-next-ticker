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
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
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
 * - 앱 → 웹: 처음 테마는 주소로, 그 뒤 ready를 받을 때와 기기 테마가 바뀔 때 theme 메시지
 * - 웹 → 앱: ready면 로딩 문구를 걷고, range면 화면 파라미터에 둔다(다시 열 때 그 기간으로)
 */
export default function WebPageScreen() {
  const params = useLocalSearchParams<{ ticker: string; range?: string }>();
  const listed = findTicker(params.ticker ?? "");
  const range = parseHistoryRange(params.range);
  const { scheme, colors, fonts, space, text } = useTheme();

  const page = useRef<EmbeddedPageHandle>(null);
  const [failed, setFailed] = useState(false);
  // 이 WebView에서 받은 ready 수. 웹이 스스로 새로 고쳐지면 ready가 다시 온다(기간 링크는 ?theme=를 넘기지 않아
  // 그때 웹은 기기 테마로 그려진다, #36 리뷰). 그래서 ready마다 테마를 다시 보낸다
  const [readyCount, setReadyCount] = useState(0);
  const status: Status = failed
    ? "error"
    : readyCount > 0
      ? "ready"
      : "loading";
  // 주소는 열 때 한 번 정한다. 웹에서 기간을 바꿔 파라미터가 바뀌어도 WebView를 다시 불러오지 않는다
  const [attempt, setAttempt] = useState(0);
  const [uri, setUri] = useState(() =>
    listed ? embedUrl(webOrigin, listed.symbol, range, scheme) : "",
  );

  // 다시 시도하면 status가 error → loading으로 바뀌어 시간을 새로 잰다
  useEffect(() => {
    if (status !== "loading") return;
    const id = setTimeout(() => setFailed(true), READY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [status]);

  // ready 전에는 웹에 리스너가 없을 수 있다. 그동안 테마가 바뀌었어도 ready 직후 이 effect가 지금 테마를 보낸다
  useEffect(() => {
    if (readyCount > 0) {
      page.current?.post(encodeToWeb({ type: "theme", theme: scheme }));
    }
  }, [scheme, readyCount]);

  // 로딩 문구가 사라지면 화면 낭독기 사용자에게 페이지가 열렸다고 알린다(포커스가 있던 문구가 없어진다)
  // 15초 시점에 ready와 시간 초과가 겹치면 오류 화면 위로 알리지 않는다
  useEffect(() => {
    if (readyCount === 1 && !failed) {
      AccessibilityInfo.announceForAccessibility("웹 페이지를 열었습니다");
    }
  }, [readyCount, failed]);

  const symbol = listed?.symbol;
  const onMessage = useCallback(
    (data: string) => {
      const message: ToAppMessage | null = decodeToApp(data);
      if (!message) return;
      if (message.type === "ready") {
        if (message.ticker === symbol) setReadyCount((count) => count + 1);
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
    setReadyCount(0);
    setFailed(false);
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
          {/* 로딩 문구는 웹 페이지를 눈으로만 가린다. 그동안 화면 낭독기가 덜 열린 페이지로 들어가지 않게 숨긴다 */}
          <View style={{ flex: 1 }} aria-hidden={status === "loading"}>
            <EmbeddedPage
              key={attempt}
              ref={page}
              uri={uri}
              origin={webOrigin}
              onMessage={onMessage}
              onLoadError={() => setFailed(true)}
            />
          </View>
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
