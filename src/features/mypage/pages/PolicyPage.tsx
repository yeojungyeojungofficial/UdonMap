import Head from "next/head";
import { useState } from "react";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import MyPageBackLink from "@/src/features/mypage/components/MyPageBackLink";
import PrivacyPolicyContent from "@/src/features/mypage/components/PrivacyPolicyContent";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";

type PolicyKey = "privacy" | null;

function ChevronRight({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
            <ChevronRight
              className={`${shell.chevron} ${
                openPolicy === "privacy" ? shell.chevronDown : ""
              }`}
            />
          </button>
          {openPolicy === "privacy" ? (
            <PrivacyPolicyContent classNames={shell} />
          ) : null}
          <div className={shell.divider} />
          <button type="button" className={shell.menuItem}>
            <span>앱 처리방침</span>
            <ChevronRight className={shell.chevron} />
          </button>
        </div>

        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}
