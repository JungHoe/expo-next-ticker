import { Stack } from "expo-router";
import { Watchlist } from "../components/watchlist";

export default function WatchlistScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "관심 종목" }} />
      <Watchlist />
    </>
  );
}
