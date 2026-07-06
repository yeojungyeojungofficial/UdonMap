import Head from "next/head";
import Link from "next/link";
import type { CSSProperties } from "react";
import chevronRightIcon from "@/src/assets/chevronRight.png";
import TopNav from "@/src/components/common/TopNav";
import CommonFooter from "@/src/components/common/CommonFooter";
import MyPageBackLink from "@/src/features/mypage/components/MyPageBackLink";
import { useRequireAuthSession } from "@/src/features/auth/hooks/useRequireAuthSession";
import { useMyPageShellStyles } from "@/src/features/mypage/useMyPageShellStyles";

type ChevronIconStyle = CSSProperties & {
  "--mypage-chevron-url"?: string;
};

const chevronRightIconStyle: ChevronIconStyle = {
  "--mypage-chevron-url": `url(${chevronRightIcon.src})`,
};

function ChevronRight({ className }: { className: string }) {
  return (
    <span className={className} style={chevronRightIconStyle} aria-hidden="true" />
  );
}

const ITEMS = [
  { label: "찜한 병원", href: "/mypage/activity/bookmarks" },
  { label: "내 제보", href: "/mypage/activity/reports" },
  { label: "내 게시글", href: "/mypage/activity/posts" },
  { label: "내 댓글", href: "/mypage/activity/comments" },
];

export default function ActivityIndexPage() {
  const { shouldRender } = useRequireAuthSession();
  const shell = useMyPageShellStyles();

  if (!shouldRender) return null;

  return (
    <>
      <Head><title>내 활동 | 우동</title></Head>
      <main className={shell.page}>
        <TopNav activeMenu="마이페이지" />
        <MyPageBackLink />
        <section className={shell.heroCard}>
          <h1 className={shell.heroTitle}>내 활동</h1>
        </section>
        <div className={shell.menuCard}>
          {ITEMS.map((item, idx) => (
            <div key={item.href}>
              {idx > 0 ? <div className={shell.divider} /> : null}
              <Link href={item.href} className={shell.menuItem}>
                <span>{item.label}</span>
                <ChevronRight className={shell.chevron} />
              </Link>
            </div>
          ))}
        </div>
        <CommonFooter className={shell.pageFooter} />
      </main>
    </>
  );
}
