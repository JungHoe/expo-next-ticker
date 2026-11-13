import { Pressable, Text, View } from "react-native";
import { useTheme } from "../lib/theme";

/** 오류·오프라인 안내와 선택적인 동작 하나. 라벨은 고정한다(바뀌면 다시 읽힌다) */
export function Message({
  text: message,
  action,
}: {
  text: string;
  action?: { label: string; onPress: () => void };
}) {
  const { colors, fonts, space, text, rule, radius } = useTheme();
  return (
    <View
      style={{ gap: space.md, padding: space.lg, alignItems: "flex-start" }}
    >
      <Text
        accessibilityRole="alert"
        style={{
          fontFamily: fonts.body,
          fontSize: text.body,
          color: colors["ink-2"],
        }}
      >
        {message}
      </Text>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => ({
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: space.lg,
            borderWidth: rule.hair,
            borderColor: colors.ink,
            borderRadius: radius.control,
            backgroundColor: pressed ? colors["paper-2"] : "transparent",
          })}
        >
          <Text
            style={{
              fontFamily: fonts.displayMedium,
              fontSize: text.label,
              color: colors.ink,
            }}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
