import Link from "next/link";
import styles from "./not-found.module.css";

/** 없는 주소와 목록에 없는 종목(stock-detail.md §4) */
export default function NotFound() {
  return (
    <section className={styles.notFound}>
      <h1>목록에 없는 종목입니다</h1>
      <p>관심 종목 10개 가운데에서 골라 주세요.</p>
      <Link href="/">관심 종목</Link>
    </section>
  );
}
