import Link from "next/link";
import styles from "./MyPageBackLink.module.css";

type MobileMyPageBackLinkProps = {
  href?: string;
  label?: string;
};

export default function MobileMyPageBackLink({
  href = "/mypage",
  label = "마이페이지로 돌아가기",
}: MobileMyPageBackLinkProps) {
  return (
    <Link href={href} className={styles.backLink} aria-label={label}>
      <svg
        className={styles.backIcon}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
