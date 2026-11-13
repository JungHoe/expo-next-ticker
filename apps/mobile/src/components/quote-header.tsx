import {
  changeTone,
  formatPercent,
  formatPrice,
  formatSigned,
} from "@ticker/market";
import { useQuote } from "@ticker/market/react";
import { Text, View } from "react-native";
import { useTheme } from "../lib/theme";
import { Message } from "./message";
import { StaleNotice } from "./stale-notice";

/** 상세 머리: 티커·종목명, 현재가(화면의 주인공), 오늘 0시 대비 등락 */
export function QuoteHeader({
  ticker,
  name,
}: {
  ticker: string;
  name: string;
}) {
  const { data: quote, isError, fetchStatus, refetch } = useQuote(ticker);
  const { colors, fonts, space, text } = useTheme();
  const tone = quote ? changeTone(quote.change) : "flat";
  const toneColor =
    tone === "up" ? colors.up : tone === "down" ? colors.down : colors["ink-2"];

  return (
    <View style={{ gap: space.sm }}>
      <View
        style={{ flexDirection: "row", alignItems: "baseline", gap: space.md }}
      >
        <Text
          style={{
            fontFamily: fonts.numMedium,
            fontSize: 15,
            color: colors.ink,
          }}
        >
          {ticker}
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: text.body,
            color: colors.muted,
          }}
        >
          {name}
        </Text>
      </View>
      {!quote && fetchStatus === "paused" ? (
        <Message text="오프라인입니다. 연결되면 다시 받습니다" />
      ) : isError && !quote ? (
        <Message
          text="시세를 불러오지 못했습니다"
          action={{ label: "다시 시도", onPress: () => refetch() }}
        />
      ) : (
        <>
          <View style={{ height: text.priceCompact }}>
            {quote ? (
              <Text
                style={{
                  fontFamily: fonts.numMedium,
                  fontSize: text.priceCompact,
                  lineHeight: text.priceCompact,
                  letterSpacing: -1.6,
                  fontVariant: ["tabular-nums"],
                  color: colors.ink,
                }}
              >
                {formatPrice(quote.price)}
              </Text>
            ) : (
              <View
                accessible
                accessibilityLabel="시세를 불러오는 중"
                accessibilityState={{ busy: true }}
                style={{
                  width: 160,
                  height: 34,
                  backgroundColor: colors["paper-2"],
                }}
              />
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: space.md,
              minHeight: 20,
            }}
          >
            {quote ? (
              <Text
                style={{
                  fontFamily: fonts.numMedium,
                  fontSize: 17,
                  fontVariant: ["tabular-nums"],
                  color: toneColor,
                }}
              >
                {formatSigned(quote.change)} {formatPercent(quote.changePct)}
              </Text>
            ) : (
              <View
                style={{
                  width: 140,
                  height: 16,
                  backgroundColor: colors["paper-2"],
                }}
              />
            )}
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: text.label,
                color: colors.muted,
              }}
            >
              오늘 0시 대비
            </Text>
          </View>
          <StaleNotice />
        </>
      )}
    </View>
  );
}

/** 기준가·고가·저가. 값이 오기 전에도 자리를 잡아 밀리지 않는다 */
export function QuoteFacts({ ticker }: { ticker: string }) {
  const { data: quote } = useQuote(ticker);
  const { colors, fonts, space, text, rule } = useTheme();
  const facts = [
    ["기준가", quote?.base],
    ["고가", quote?.high],
    ["저가", quote?.low],
  ] as const;
  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: rule.bar,
        borderTopColor: colors["rule-2"],
        paddingTop: space.md,
      }}
    >
      {facts.map(([label, value]) => (
        <View
          key={label}
          style={{ flex: 1 }}
          accessible
          accessibilityLabel={
            value === undefined ? label : `${label} ${formatPrice(value)}`
          }
        >
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: text.label,
              color: colors.muted,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: fonts.numMedium,
              fontSize: text.body,
              lineHeight: text.body * 1.4,
              fontVariant: ["tabular-nums"],
              color: colors.ink,
            }}
          >
            {value === undefined ? " " : formatPrice(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}
