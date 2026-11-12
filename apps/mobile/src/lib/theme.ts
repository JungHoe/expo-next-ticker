import { HankenGrotesk_500Medium } from "@expo-google-fonts/hanken-grotesk/500Medium";
import { HankenGrotesk_600SemiBold } from "@expo-google-fonts/hanken-grotesk/600SemiBold";
import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono/400Regular";
import { IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono/500Medium";
import { Newsreader_400Regular } from "@expo-google-fonts/newsreader/400Regular";
import { Newsreader_500Medium } from "@expo-google-fonts/newsreader/500Medium";
import { hexColors, radius, rule, space, text } from "@ticker/tokens";
import { useColorScheme } from "react-native";

/**
 * 앱이 쓰는 글꼴. 패키지 루트 대신 굵기별 경로에서 가져와 필요한 6개만 번들에 넣는다.
 * 한글은 이 글꼴에 없으므로 기기 기본 고딕이 대신 그린다(design-tokens.md §3).
 */
export const fontAssets = {
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  Newsreader_400Regular,
  Newsreader_500Medium,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
};

/** RN은 굵기마다 별도 family 이름을 쓴다 */
export const fonts = {
  display: "HankenGrotesk_600SemiBold",
  displayMedium: "HankenGrotesk_500Medium",
  body: "Newsreader_400Regular",
  bodyMedium: "Newsreader_500Medium",
  num: "IBMPlexMono_400Regular",
  numMedium: "IBMPlexMono_500Medium",
} as const satisfies Record<string, keyof typeof fontAssets>;

/** 기기 설정(라이트·다크)에 맞는 토큰. 색은 @ticker/tokens가 미리 #rrggbb로 바꿔 둔 값이다 */
export function useTheme() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return {
    scheme,
    colors: hexColors[scheme],
    fonts,
    space,
    text,
    rule,
    radius,
  };
}
