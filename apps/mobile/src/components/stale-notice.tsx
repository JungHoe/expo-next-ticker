import { useQuoteFreshness } from "@ticker/market/react";
import { Text, View } from "react-native";
import { useTheme } from "../lib/theme";

/**
 * 값이 있다가 끊겼을 때 "N초 전 시세". 판정은 웹과 같은 공용 훅이 한다.
 * 보조 기술에는 고정 문구만 알리고, 매초 바뀌는 숫자는 읽지 않게 한다(watchlist.md §4)
 */
export function StaleNotice() {
  const { stale, secondsAgo } = useQuoteFreshness();
  const { colors, fonts, text } = useTheme();
  if (!stale) return null;
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel="시세 연결이 끊겨 마지막 값을 보여 줍니다"
    >
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: text.label,
          color: colors.muted,
        }}
      >
        {secondsAgo === null ? "" : `${secondsAgo}초 전 시세`}
      </Text>
    </View>
  );
}
