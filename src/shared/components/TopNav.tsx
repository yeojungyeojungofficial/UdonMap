import Link from "next/link";
import styles from "@/src/shared/components/TopNav.module.css";

const MENUS = [
  { label: "병원찾기", href: "/" },
  { label: "병원후기", href: "/reviews" },
  { label: "병원제보", action: "report" },
  { label: "마이페이지", href: "/mypage" },
];

type TopNavProps = {
  activeMenu: string;
  onSelectMenu?: (menu: string) => void;
  onOpenReport?: () => void;
};

export default function TopNav({
  activeMenu,
  onSelectMenu,
  onOpenReport,
}: TopNavProps) {
  return (
    <header className={styles.topNav}>
      <div className={styles.logoWrap}>
        <span className={styles.logoMark}>AM</span>
        <p className={styles.logoText}>우동</p>
      </div>
      <nav className={styles.menuWrap} aria-label="상단 메뉴">
        {MENUS.map((menu) => {
          const isActive = activeMenu === menu.label;
          const menuClassName = `${styles.menuButton} ${
            isActive ? styles.menuButtonActive : ""
          }`;

          if (menu.href) {
            return (
              <Link
                key={menu.label}
                href={menu.href}
                className={menuClassName}
                onClick={() => onSelectMenu?.(menu.label)}
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
              className={menuClassName}
              onClick={() => {
                onSelectMenu?.(menu.label);
                if (menu.action === "report") {
                  onOpenReport?.();
                }
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
