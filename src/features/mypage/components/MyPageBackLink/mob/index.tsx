import Link from "next/link";
import type { CSSProperties } from "react";
import chevronLeftIcon from "@/src/assets/chevronLeft.png";
import styles from "./MyPageBackLink.module.css";

type MobileMyPageBackLinkProps = {
  href?: string;
  label?: string;
};

type BackIconStyle = CSSProperties & {
  "--back-icon-url"?: string;
};

const backIconStyle: BackIconStyle = {
  "--back-icon-url": `url(${chevronLeftIcon.src})`,
};

export default function MobileMyPageBackLink({
  href = "/mypage",
  label = "마이페이지로 돌아가기",
}: MobileMyPageBackLinkProps) {
  return (
    <Link href={href} className={styles.backLink} aria-label={label}>
      <span
        className={styles.backIcon}
        style={backIconStyle}
        aria-hidden="true"
      />
      <span>{label}</span>
    </Link>
  );
}
