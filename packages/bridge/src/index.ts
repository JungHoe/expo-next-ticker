/**
 * 앱 ↔ 웹(WebView·iframe) 메시지 규격. 근거: docs/spec/webview-bridge.md §3
 *
 * - 메시지는 JSON 문자열이다(react-native-webview의 웹→앱 postMessage가 문자열만 받는다)
 * - 모든 메시지에 ns·v가 붙는다. 브라우저에서는 확장 프로그램·개발 도구도 window에 message를 보내므로 ns로 우리 것만
 *   고르고, 규격을 바꾸면 v로 구분한다
 * - 받는 쪽은 decode가 null이면 조용히 무시한다. 예외를 던지지 않는다
 * - DOM·React Native API를 쓰지 않는다. 웹과 앱이 이 파일을 그대로 쓴다
 */
import { HistoryRangeSchema } from "@ticker/market";
import type { ColorMode } from "@ticker/tokens";
import { z } from "zod";

export const BRIDGE_NS = "ticker";
export const BRIDGE_VERSION = 1;

/** 토큰의 색 모드 이름과 같다 */
const THEMES = ["light", "dark"] as const satisfies readonly ColorMode[];
export const ThemeSchema = z.enum(THEMES);
export type Theme = z.infer<typeof ThemeSchema>;

const envelope = {
  ns: z.literal(BRIDGE_NS),
  v: z.literal(BRIDGE_VERSION),
};

/** 앱 → 웹 */
export const ToWebSchema = z.discriminatedUnion("type", [
  z.object({ ...envelope, type: z.literal("theme"), theme: ThemeSchema }),
]);

/** 웹 → 앱 */
export const ToAppSchema = z.discriminatedUnion("type", [
  // 임베드 페이지가 하이드레이션된 뒤 한 번. 앱은 이걸 받고 로딩 문구를 걷는다
  z.object({
    ...envelope,
    type: z.literal("ready"),
    ticker: z.string(),
    theme: ThemeSchema,
    range: HistoryRangeSchema,
  }),
  // 웹에서 기간을 바꿨을 때
  z.object({
    ...envelope,
    type: z.literal("range"),
    range: HistoryRangeSchema,
  }),
]);

/** 유니온의 각 메시지에서 ns·v를 뺀다(보내는 쪽은 내용만 쓴다) */
type Content<T> = T extends unknown ? Omit<T, "ns" | "v"> : never;
export type ToWebMessage = Content<z.infer<typeof ToWebSchema>>;
export type ToAppMessage = Content<z.infer<typeof ToAppSchema>>;

function encode(message: ToWebMessage | ToAppMessage): string {
  return JSON.stringify({ ns: BRIDGE_NS, v: BRIDGE_VERSION, ...message });
}

function decode<T>(schema: z.ZodType<T & { ns: string; v: number }>) {
  return (raw: unknown): Content<T> | null => {
    if (typeof raw !== "string") return null;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
    const parsed = schema.safeParse(value);
    if (!parsed.success) return null;
    const { ns: _ns, v: _v, ...content } = parsed.data;
    return content as Content<T>;
  };
}

export const encodeToWeb: (message: ToWebMessage) => string = encode;
export const encodeToApp: (message: ToAppMessage) => string = encode;
export const decodeToWeb = decode(ToWebSchema);
export const decodeToApp = decode(ToAppSchema);

/**
 * WebView의 injectJavaScript에 넘길 코드. 페이지 window에 message 이벤트를 보낸다. iframe의 postMessage와 같은
 * 리스너 하나로 받게 하려는 것이다(spec §7). JSON.stringify로 문자열 리터럴을 만들어 따옴표·줄바꿈이 코드를 깨지
 * 않는다. injectJavaScript는 HTML이 아니라 JS로 실행하므로 `</script>`도 그대로 문자열이다(HTML 안에 넣는 용도가
 * 아니다). react-native-webview 문서대로 끝에 true를 둔다
 */
export function messageEventScript(data: string): string {
  return `window.dispatchEvent(new MessageEvent("message", { data: ${JSON.stringify(data)} }));true;`;
}
