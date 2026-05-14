import Head from "next/head";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";

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
  return (
    <>
      <Head>
        <title>약관 및 정책 | 우동</title>
      </Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />

        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>약관 및 정책</h1>
        </section>

        <div className={shell.menuCard}>
          <button type="button" className={shell.menuItem}>
            <span>개인정보 처리방침</span>
            <ChevronRight className={shell.chevron} />
          </button>
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
