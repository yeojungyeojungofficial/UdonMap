import Link from "next/link";
import styles from "./TopNav.module.css";

type MenuItem =
  | { label: string; href: string; action?: never }
  | { label: string; action: "report"; href?: never };

const MENUS: MenuItem[] = [
  { label: "병원찾기", href: "/" },
  { label: "병원후기", href: "/reviews" },
  { label: "병원제보", action: "report" },
  { label: "마이페이지", href: "/mypage" },
  { label: "후원하기", href: "/support" },
];

const MENU_ICONS: Record<string, React.ReactNode> = {
  병원찾기: (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  병원후기: (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  병원제보: (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  마이페이지: (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  후원하기: (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 4 14.5 4 9a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.5-8 12-8 12z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export type TopNavProps = {
  activeMenu: string;
  onSelectMenu?: (menu: string) => void;
  onOpenReport?: () => void;
};

export default function MobileTopNav({
  activeMenu,
  onSelectMenu,
  onOpenReport,
}: TopNavProps) {
  return (
    <>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logoText}
          aria-label="홈으로 이동"
          onClick={() => onSelectMenu?.("병원찾기")}
        >
          <span>우</span>리동네 <span>동</span>물병원
        </Link>
      </header>

      <nav className={styles.bottomNav} aria-label="하단 메뉴">
        {MENUS.map((menu) => {
          const isActive = activeMenu === menu.label;
          const className = `${styles.navItem} ${isActive ? styles.navItemActive : ""}`;

          if (menu.href) {
            return (
              <Link
                key={menu.label}
                href={menu.href}
                className={className}
                onClick={() => onSelectMenu?.(menu.label)}
                aria-current={isActive ? "page" : undefined}
              >
                {MENU_ICONS[menu.label]}
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
              {MENU_ICONS[menu.label]}
              {menu.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
