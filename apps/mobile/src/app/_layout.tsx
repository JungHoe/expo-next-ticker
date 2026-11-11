import { QueryClientProvider } from "@tanstack/react-query";
import { MarketApiProvider } from "@ticker/market/react";
import { Stack } from "expo-router";
import { connectQueryToDevice, marketApi, queryClient } from "../lib/market";

connectQueryToDevice();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketApiProvider config={marketApi}>
        <Stack />
      </MarketApiProvider>
    </QueryClientProvider>
  );
}
