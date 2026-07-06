import Head from "next/head";
import { useState, type CSSProperties } from "react";
import chevronDownIcon from "@/src/assets/chevronDown.png";
import chevronRightIcon from "@/src/assets/chevronRight.png";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import MyPageBackLink from "@/src/features/mypage/components/MyPageBackLink";
import PrivacyPolicyContent from "@/src/features/mypage/components/PrivacyPolicyContent";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";

type PolicyKey = "privacy" | null;

type ChevronIconStyle = CSSProperties & {
  "--mypage-chevron-url"?: string;
};

const chevronRightIconStyle: ChevronIconStyle = {
  "--mypage-chevron-url": `url(${chevronRightIcon.src})`,
};

const chevronDownIconStyle: ChevronIconStyle = {
  "--mypage-chevron-url": `url(${chevronDownIcon.src})`,
};

function ChevronIcon({
  className,
  isDown = false,
}: {
  className: string;
  isDown?: boolean;
}) {
  return (
    <span
      className={className}
      style={isDown ? chevronDownIconStyle : chevronRightIconStyle}
      aria-hidden="true"
    />
  );
}

export default function PolicyPage() {
  const shell = useMyPageShellStyles();
  const [openPolicy, setOpenPolicy] = useState<PolicyKey>(null);

  return (
    <>
      <Head>
        <title>약관 및 정책 | 우동</title>
      </Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />
        <MyPageBackLink />

        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>약관 및 정책</h1>
        </section>

        <div className={shell.menuCard}>
          <button
            type="button"
            className={shell.menuItem}
            aria-expanded={openPolicy === "privacy"}
            onClick={() =>
              setOpenPolicy((current) =>
                current === "privacy" ? null : "privacy",
              )
            }
          >
            <span>개인정보 처리방침</span>
            <ChevronIcon
              className={`${shell.chevron} ${
                openPolicy === "privacy" ? shell.chevronDown : ""
              }`}
              isDown={openPolicy === "privacy"}
            />
          </button>
          {openPolicy === "privacy" ? (
            <PrivacyPolicyContent classNames={shell} />
          ) : null}
          <div className={shell.divider} />
          <button type="button" className={shell.menuItem}>
            <span>앱 처리방침</span>
            <ChevronIcon className={shell.chevron} />
          </button>
        </div>

        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}
