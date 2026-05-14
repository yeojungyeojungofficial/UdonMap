import styles from "./CommonFooter.module.css";

const COMPANY_NAME = "여정";
const REPRESENTATIVE_NAME = "박인권";
const CONTACT_EMAIL = "yeojungofficial@gmail.com";

type CommonFooterProps = {
  className?: string;
};

export default function DesktopFooter({ className }: CommonFooterProps) {
  const footerClassName = [styles.footer, className].filter(Boolean).join(" ");

  return (
    <footer className={footerClassName}>
      <div className={styles.content}>
        <p>
          © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </p>
        <p>
          대표 {REPRESENTATIVE_NAME} | 이메일{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </footer>
  );
}
