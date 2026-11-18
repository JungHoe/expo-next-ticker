import type { Ref } from "react";

/** 화면이 임베드 페이지에 하는 일. 메시지는 이미 encode한 문자열이다 */
export type EmbeddedPageHandle = {
  post(data: string): void;
};

/**
 * 네이티브(react-native-webview)와 웹 미리보기(iframe)가 같은 props를 받는다(webview-bridge.md §7).
 * 다시 불러오기는 화면이 key를 바꿔 새로 마운트한다
 */
export type EmbeddedPageProps = {
  uri: string;
  /** 웹 출처(끝 "/" 없음). 이 출처의 페이지만 띄우고, 이 출처에서 온 메시지만 받는다 */
  origin: string;
  onMessage(data: string): void;
  /** 페이지를 불러오지 못했다(네트워크·HTTP 오류). iframe은 알 수 없어 화면의 ready 대기 시간이 맡는다 */
  onLoadError(): void;
  ref?: Ref<EmbeddedPageHandle>;
};
