import { useQuoteFreshness } from "@ticker/market/react";
import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

const ANNOUNCEMENT = "시세 연결이 끊겨 마지막 값을 보여 줍니다";

/**
 * 값이 있다가 끊겼을 때 "N초 전 시세". 판정은 웹과 같은 공용 훅이 한다.
 * 끊긴 순간에만 고정 문구를 한 번 알린다(Android·iOS 모두 announceForAccessibility).
 * 매초 바뀌는 숫자는 보조 기술에서 숨긴다(watchlist.md §4, #14 리뷰)
 */
export function StaleNotice() {
  const { stale, secondsAgo } = useQuoteFreshness();
  const { colors, fonts, text } = useTheme();
  useEffect(() => {
    if (stale) AccessibilityInfo.announceForAccessibility(ANNOUNCEMENT);
  }, [stale]);
  if (!stale) return null;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
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
