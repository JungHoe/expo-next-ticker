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
  const { data: quote, isError, refetch } = useQuote(ticker);
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
      {isError && !quote ? (
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
