import { QueryClientProvider } from "@tanstack/react-query";
import { MarketApiProvider } from "@ticker/market/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { connectQueryToDevice, marketApi, queryClient } from "../lib/market";
import { fontAssets, useTheme } from "../lib/theme";

connectQueryToDevice();
// 글꼴이 준비될 때까지 스플래시를 유지해 대체 글꼴로 그렸다가 바뀌는 깜빡임을 막는다
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const { colors, fonts } = useTheme();

  useEffect(() => {
    // 글꼴을 못 불러와도 앱은 연다(시스템 글꼴로 그린다)
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <MarketApiProvider config={marketApi}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.sheet },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: fonts.display },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        />
      </MarketApiProvider>
    </QueryClientProvider>
  );
}
