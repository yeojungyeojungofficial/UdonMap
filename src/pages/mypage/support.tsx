import Head from "next/head";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import MyPageBackLink from "@/src/components/mypage/MyPageBackLink";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";

export default function SupportPage() {
  const shell = useMyPageShellStyles();
  return (
    <>
      <Head>
        <title>고객센터 | 우동</title>
      </Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />
        <MyPageBackLink />

        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>고객센터</h1>
          <p className={shell.heroDesc}>
            문의 사항이 있으시면 아래 이메일로 연락해 주세요.
          </p>
          <a
            href="mailto:yeojungofficial@gmail.com"
            className={shell.contactLink}
          >
            yeojungofficial@gmail.com
          </a>
        </section>

        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}
