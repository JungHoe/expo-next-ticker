import styles from "./page.module.css";

/** 넓은 화면의 상세 자리. 좁은 화면에서는 목록만 보이므로 숨는다(market.module.css) */
export default function Home() {
  return (
    <section className={styles.empty}>
      <h1 className="visually-hidden">관심 종목 시세</h1>
      <p>왼쪽에서 종목을 고르세요</p>
    </section>
  );
}
