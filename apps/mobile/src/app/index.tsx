import { Stack } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

export default function HomeScreen() {
  const { colors, fonts, space, text, rule } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <Stack.Screen options={{ title: "Ticker" }} />
      <View
        style={{
          borderBottomWidth: rule.hair,
          borderBottomColor: colors.rule,
          paddingBottom: space.md,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: text.label,
            color: colors.muted,
          }}
        >
          시뮬레이션 시세입니다. 실제 시세가 아닙니다
        </Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: text.heading,
          color: colors.ink,
        }}
      >
        시뮬레이션 시세
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: text.body,
          lineHeight: text.body * 1.55,
          color: colors["ink-2"],
        }}
      >
        실제 미국 주식 티커 10개에, 시각을 넣으면 가격이 나오는 결정적 생성기로
        만든 시세를 붙였습니다. 웹과 앱은 같은 API에서 같은 시각의 같은 가격을
        받습니다.
      </Text>
    </ScrollView>
  );
}
