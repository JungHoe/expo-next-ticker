import { findTicker } from "@ticker/market";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";
import { Message } from "../../components/message";
import { PriceChart } from "../../components/price-chart";
import { QuoteFacts, QuoteHeader } from "../../components/quote-header";
import { useTheme } from "../../lib/theme";

export default function StockScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const listed = findTicker(ticker ?? "");
  const { space } = useTheme();

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
    </ScrollView>
  );
}
