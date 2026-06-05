import Link from "next/link";
import { useRouter } from "next/router";
import type { MouseEvent } from "react";
import { useHospitalMapStore } from "@/src/store/hospitalMapStore";
import styles from "./TopNav.module.css";

type MenuItem =
  | { label: string; href: string; action?: never }
  | { label: string; action: "report"; href?: never };

const MENUS: MenuItem[] = [
  { label: "병원찾기", href: "/" },
  { label: "병원후기", href: "/reviews" },
  { label: "병원제보", action: "report" },
  { label: "마이페이지", href: "/mypage" },
];

export type TopNavProps = {
  activeMenu: string;
  onSelectMenu?: (menu: string) => void;
  onOpenReport?: () => void;
};

export default function DesktopTopNav({
  activeMenu,
  onSelectMenu,
  onOpenReport,
}: TopNavProps) {
  const router = useRouter();
  const resetHome = useHospitalMapStore((state) => state.resetHome);
  const handleHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (router.pathname === "/") {
      event.preventDefault();
    }

    resetHome();
    onSelectMenu?.("병원찾기");
  };

  return (
    <header className={styles.topNav}>
      <div className={styles.logoWrap}>
        <Link
          href="/"
          className={styles.logoText}
          aria-label="홈으로 이동"
          onClick={handleHomeClick}
        >
          <span>우</span>리동네 <span>동</span>물병원
        </Link>
      </div>
      <nav className={styles.menuWrap} aria-label="상단 메뉴">
        {MENUS.map((menu) => {
          const isActive = activeMenu === menu.label;
          const className = `${styles.menuButton} ${
            isActive ? styles.menuButtonActive : ""
          }`;

          if (menu.href) {
            return (
              <Link
                key={menu.label}
                href={menu.href}
                className={className}
                onClick={(event) => {
                  if (menu.href === "/") {
                    if (router.pathname === "/") {
                      event.preventDefault();
                    }
                    resetHome();
                  }
                  onSelectMenu?.(menu.label);
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {menu.label}
              </Link>
            );
          }

          return (
            <button
              key={menu.label}
              type="button"
              className={className}
              onClick={() => {
                onSelectMenu?.(menu.label);
                if (menu.action === "report") onOpenReport?.();
              }}
              aria-pressed={isActive}
            >
              {menu.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
