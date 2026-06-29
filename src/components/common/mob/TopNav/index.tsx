import Link from "next/link";
import { useRouter } from "next/router";
import type { CSSProperties, MouseEvent } from "react";
import type { StaticImageData } from "next/image";
import commentIcon from "@/src/assets/comment.png";
import mypageIcon from "@/src/assets/mypage.png";
import pinIcon from "@/src/assets/pin.png";
import reportIcon from "@/src/assets/report.png";
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

const MENU_ICONS: Record<string, StaticImageData> = {
  병원찾기: pinIcon,
  병원후기: commentIcon,
  병원제보: reportIcon,
  마이페이지: mypageIcon,
};

type NavIconStyle = CSSProperties & {
  "--nav-icon-url"?: string;
};

function NavIcon({ label }: { label: string }) {
  const icon = MENU_ICONS[label];
  const iconStyle: NavIconStyle = {
    "--nav-icon-url": `url(${icon.src})`,
  };

  return <span className={styles.navIcon} style={iconStyle} aria-hidden="true" />;
}

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
    <>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logoText}
          aria-label="홈으로 이동"
          onClick={handleHomeClick}
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
                <NavIcon label={menu.label} />
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
              <NavIcon label={menu.label} />
              {menu.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
