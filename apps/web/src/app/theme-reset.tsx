"use client";

import { useLayoutEffect } from "react";

/**
 * 임베드 밖의 페이지는 기기 테마를 따른다. 임베드에서 링크로(소프트 이동) 넘어오면 인라인 스크립트가 다시 돌지 않고
 * React도 <html>의 data-theme을 건드리지 않아, 앱이 정한 테마가 남는다(#36 리뷰에서 재현: 임베드 404 → "/").
 * 그려지기 전에 지운다
 */
export function ThemeReset() {
  useLayoutEffect(() => {
    if (!window.location.pathname.startsWith("/embed/")) {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);
  return null;
}
