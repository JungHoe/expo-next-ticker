import { findTicker, parseHistoryRange } from "@ticker/market";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import { Message } from "../../components/message";
import { PriceChart } from "../../components/price-chart";
import { QuoteFacts, QuoteHeader } from "../../components/quote-header";
import { useTheme } from "../../lib/theme";

export default function StockScreen() {
  const { ticker, range } = useLocalSearchParams<{
    ticker: string;
    range?: string;
  }>();
  const listed = findTicker(ticker ?? "");
  const { colors, fonts, space, text } = useTheme();

  if (!listed) {
    // 목록에 없는 티커(딥링크 등). 뒤로 가기는 스택 헤더가 맡는다(stock-detail.md §4)
    return (
      <>
        <Stack.Screen options={{ title: "종목" }} />
        <Message text="목록에 없는 종목입니다" />
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <Stack.Screen
        options={{ title: listed.symbol, headerBackTitle: "관심 종목" }}
      />
      <QuoteHeader ticker={listed.symbol} name={listed.name} />
      <PriceChart ticker={listed.symbol} />
      <QuoteFacts ticker={listed.symbol} />
      {/* 같은 종목의 웹 페이지를 앱 안에서 연다. 지금 고른 기간으로 연다(webview-bridge.md §2, §4) */}
      <Link
        href={{
          pathname: "/web/[ticker]",
          params: { ticker: listed.symbol, range: parseHistoryRange(range) },
        }}
        asChild
      >
        {/* Link asChild는 자식의 함수형 style을 버린다. 눌림 상태는 children 함수로 받는다(#14 리뷰) */}
        <Pressable accessibilityRole="link" style={{ alignSelf: "flex-start" }}>
          {({ pressed }) => (
            <Text
              style={{
                minHeight: 44,
                paddingVertical: space.sm,
                fontFamily: fonts.displayMedium,
                fontSize: text.label,
                color: colors.ink,
                textDecorationLine: "underline",
                backgroundColor: pressed ? colors["paper-2"] : "transparent",
              }}
            >
              웹 페이지로 보기
            </Text>
          )}
        </Pressable>
      </Link>
    </ScrollView>
  );
}
