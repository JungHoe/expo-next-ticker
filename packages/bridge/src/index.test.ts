import { describe, expect, it } from "vitest";
import {
  decodeToApp,
  decodeToWeb,
  embedUrl,
  encodeToApp,
  encodeToWeb,
  messageEventScript,
  originOf,
} from "./index";

describe("메시지 규격(webview-bridge.md §3)", () => {
  it("앱 → 웹 theme 왕복", () => {
    const raw = encodeToWeb({ type: "theme", theme: "dark" });
    expect(JSON.parse(raw)).toEqual({
      ns: "ticker",
      v: 1,
      type: "theme",
      theme: "dark",
    });
    expect(decodeToWeb(raw)).toEqual({ type: "theme", theme: "dark" });
  });

  it("웹 → 앱 ready·range 왕복", () => {
    const ready = {
      type: "ready",
      ticker: "AAPL",
      theme: "light",
      range: "1h",
    } as const;
    expect(decodeToApp(encodeToApp(ready))).toEqual(ready);
    expect(decodeToApp(encodeToApp({ type: "range", range: "1w" }))).toEqual({
      type: "range",
      range: "1w",
    });
  });

  it("방향이 다른 메시지는 받지 않는다", () => {
    expect(decodeToApp(encodeToWeb({ type: "theme", theme: "dark" }))).toBe(
      null,
    );
    expect(decodeToWeb(encodeToApp({ type: "range", range: "1d" }))).toBe(null);
  });

  it.each([
    ["JSON이 아님", "theme:dark"],
    ["문자열이 아님", { ns: "ticker", v: 1, type: "theme", theme: "dark" }],
    ["모르는 type", JSON.stringify({ ns: "ticker", v: 1, type: "reload" })],
    [
      "다른 v",
      JSON.stringify({ ns: "ticker", v: 2, type: "theme", theme: "dark" }),
    ],
    [
      "다른 ns(다른 출처의 message)",
      JSON.stringify({ ns: "devtools", v: 1, type: "theme", theme: "dark" }),
    ],
    [
      "필드 값 오류",
      JSON.stringify({ ns: "ticker", v: 1, type: "theme", theme: "sepia" }),
    ],
    ["빈 문자열", ""],
    ["null 문자열", "null"],
  ])("%s → null, 예외 없음", (_label, raw) => {
    expect(decodeToWeb(raw)).toBe(null);
    expect(decodeToApp(raw)).toBe(null);
  });

  it("범위 밖 기간은 받지 않는다", () => {
    const raw = JSON.stringify({
      ns: "ticker",
      v: 1,
      type: "range",
      range: "5y",
    });
    expect(decodeToApp(raw)).toBe(null);
  });
});

describe("injectJavaScript용 코드", () => {
  /** 페이지 대신 window·MessageEvent만 흉내 내고 코드를 실행한다 */
  function run(script: string) {
    const received: unknown[] = [];
    const window = {
      dispatchEvent: (event: { data: unknown }) => received.push(event.data),
    };
    class MessageEvent {
      data: unknown;
      constructor(_type: string, init: { data: unknown }) {
        this.data = init.data;
      }
    }
    const result = new Function(
      "window",
      "MessageEvent",
      `return ${script.replace(/;true;$/, ";")}`,
    )(window, MessageEvent);
    return { received, result };
  }

  it("받은 문자열을 그대로 message 이벤트 data로 보낸다", () => {
    const data = encodeToWeb({ type: "theme", theme: "light" });
    expect(run(messageEventScript(data)).received).toEqual([data]);
  });

  it("따옴표·줄바꿈·</script>가 있어도 코드가 깨지지 않는다", () => {
    const tricky = `"); alert(1); ("\n</script> '`;
    expect(run(messageEventScript(tricky)).received).toEqual([tricky]);
  });

  it("문서대로 true로 끝난다", () => {
    expect(messageEventScript("x").endsWith("true;")).toBe(true);
  });
});

describe("임베드 주소", () => {
  it("경로·기간·테마", () => {
    expect(embedUrl("https://ticker.test", "AAPL", "1d", "dark")).toBe(
      "https://ticker.test/embed/stocks/AAPL?range=1d&theme=dark",
    );
  });

  it("티커는 경로 문자로 인코딩한다", () => {
    expect(embedUrl("http://localhost:3000", "A/B?", "1h", "light")).toBe(
      "http://localhost:3000/embed/stocks/A%2FB%3F?range=1h&theme=light",
    );
  });

  it.each([
    ["https://ticker.test/embed/stocks/AAPL?range=1h", "https://ticker.test"],
    ["http://localhost:3000", "http://localhost:3000"],
    ["https://ticker.test.evil.example/x", "https://ticker.test.evil.example"],
    ["https://ticker.test#x", "https://ticker.test"],
    ["about:blank", ""],
    ["not a url", ""],
  ])("%s의 출처는 %s", (url, origin) => {
    expect(originOf(url)).toBe(origin);
  });
});
