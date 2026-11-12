import styles from "./page.module.css";

export default function Home() {
  return (
    <section className={styles.intro}>
      <h1>시뮬레이션 시세</h1>
      <p>
        실제 미국 주식 티커 10개에, 시각을 넣으면 가격이 나오는 결정적 생성기로
        만든 시세를 붙였습니다. 웹과 앱은 같은 API에서 같은 시각의 같은 가격을
        받습니다.
      </p>
      <p>
        시세 API: <a href="/api/quotes">/api/quotes</a>
      </p>
    </section>
  );
}
