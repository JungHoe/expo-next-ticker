import {
  changeTone,
  formatPercent,
  formatPrice,
  type Quote,
  quoteLabel,
  TICKERS,
} from "@ticker/market";
import { useQuotes } from "@ticker/market/react";
import { Link } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { useTheme } from "../lib/theme";
import { Message } from "./message";
import { StaleNotice } from "./stale-notice";

/** 실제 행과 뼈대 행이 같은 높이라 값이 들어와도 밀리지 않는다 */
const ROW_HEIGHT = 56;
const PRICE_WIDTH = 96;
const PERCENT_WIDTH = 80;

export function Watchlist() {
  const { data, isError, fetchStatus, refetch } = useQuotes();
  const { colors, fonts, space, text, rule } = useTheme();
  const label = {
    fontFamily: fonts.body,
    fontSize: text.label,
    color: colors.muted,
  };

  const header = (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingHorizontal: space.lg,
          paddingTop: space.md,
          paddingBottom: space.sm,
          gap: space.md,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.body,
            fontSize: text.label,
            color: colors.muted,
          }}
        >
          시뮬레이션 시세입니다. 실제 시세가 아닙니다
        </Text>
        <StaleNotice />
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          flexDirection: "row",
          gap: space.md,
          paddingHorizontal: space.lg,
          paddingVertical: space.xs,
          borderBottomWidth: rule.bar,
          borderBottomColor: colors["rule-2"],
        }}
      >
        <Text style={[label, { flex: 1 }]}>종목</Text>
        <Text style={[label, { width: PRICE_WIDTH, textAlign: "right" }]}>
          현재가
        </Text>
        <Text style={[label, { width: PERCENT_WIDTH, textAlign: "right" }]}>
          등락률
        </Text>
      </View>
    </View>
  );

  if (!data) {
    return (
      <View style={{ flex: 1 }}>
        {header}
        {fetchStatus === "paused" ? (
          <Message text="오프라인입니다. 연결되면 다시 받습니다" />
        ) : isError ? (
          <Message
            text="시세를 불러오지 못했습니다"
            action={{ label: "다시 시도", onPress: () => refetch() }}
          />
        ) : (
          <View
            accessible
            accessibilityLabel="시세를 불러오는 중"
            accessibilityState={{ busy: true }}
          >
            {TICKERS.map((ticker) => (
              <RowFrame
                key={ticker.symbol}
                symbol={ticker.symbol}
                name={ticker.name}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={data.quotes}
      keyExtractor={(quote) => quote.ticker}
      ListHeaderComponent={header}
      renderItem={({ item }) => <Row quote={item} />}
    />
  );
}

function Row({ quote }: { quote: Quote }) {
  const { colors } = useTheme();
  // 목록은 등락률을 보여 주므로 색도 보이는 등락률로 정한다(-0.01이 0.00%면 보합)
  const tone = changeTone(quote.changePct);
  const toneColor =
    tone === "up" ? colors.up : tone === "down" ? colors.down : colors["ink-2"];
  return (
    <Link
      href={{ pathname: "/stocks/[ticker]", params: { ticker: quote.ticker } }}
      asChild
    >
      {/* Link asChild는 자식의 함수형 style을 병합하며 버린다. 눌림 상태는 children 함수로 받아 틀에 넘긴다(#14 리뷰) */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={quoteLabel(quote)}
      >
        {({ pressed }) => (
          <RowFrame
            symbol={quote.ticker}
            name={quote.name}
            price={formatPrice(quote.price)}
            percent={formatPercent(quote.changePct)}
            percentColor={toneColor}
            pressed={pressed}
          />
        )}
      </Pressable>
    </Link>
  );
}

/** 행 하나의 틀. 값이 없으면 숫자 자리에 같은 크기의 자리 표시를 둔다 */
function RowFrame({
  symbol,
  name,
  price,
  percent,
  percentColor,
  pressed = false,
}: {
  symbol: string;
  name: string;
  price?: string;
  percent?: string;
  percentColor?: string;
  pressed?: boolean;
}) {
  const { colors, fonts, space, text, rule } = useTheme();
  const number = {
    fontFamily: fonts.num,
    fontSize: 15,
    fontVariant: ["tabular-nums"] as const,
    textAlign: "right" as const,
  };
  const placeholder = {
    alignSelf: "flex-end" as const,
    width: 64,
    height: 12,
    backgroundColor: colors["paper-2"],
  };
  return (
    <View
      style={{
        // 최소 높이: 기기 글꼴 크기를 키워도 잘리지 않고, 뼈대와 실제 행이 같은 높이에서 시작한다
        minHeight: ROW_HEIGHT,
        flexDirection: "row",
        backgroundColor: pressed ? colors["paper-2"] : "transparent",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.lg,
        borderBottomWidth: rule.hair,
        borderBottomColor: colors.rule,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: fonts.numMedium,
            fontSize: 14,
            color: colors.ink,
          }}
        >
          {symbol}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.body,
            fontSize: text.label,
            color: colors.muted,
          }}
        >
          {name}
        </Text>
      </View>
      <View style={{ width: PRICE_WIDTH }}>
        {price ? (
          <Text style={[number, { color: colors["ink-2"] }]}>{price}</Text>
        ) : (
          <View style={placeholder} />
        )}
      </View>
      <View style={{ width: PERCENT_WIDTH }}>
        {percent ? (
          <Text style={[number, { color: percentColor }]}>{percent}</Text>
        ) : (
          <View style={placeholder} />
        )}
      </View>
    </View>
  );
}
