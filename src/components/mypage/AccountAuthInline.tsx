import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import PrivacyPolicyDialog from "@/src/components/mypage/PrivacyPolicyDialog";
import type { AuthMode } from "@/src/features/mypage/types";

type AccountAuthInlineClassNames = Readonly<Record<string, string>>;

type AccountAuthInlineProps = {
  authMessage: string;
  authMode: AuthMode;
  canSubmit: boolean;
  classNames: AccountAuthInlineClassNames;
  email: string;
  handleAuthModeChange: (nextAuthMode: AuthMode) => void;
  handleAutoLoginChange: (checked: boolean) => void;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handlePasswordConfirmChange: (value: string) => void;
  handlePrivacyPolicyAgreementChange: (checked: boolean) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  isAuthReady: boolean;
  isAutoLoginChecked: boolean;
  isPrivacyPolicyAgreed: boolean;
  isSubmitting: boolean;
  password: string;
  passwordConfirm: string;
};

export default function AccountAuthInline({
  authMessage,
  authMode,
  canSubmit,
  classNames,
  email,
  handleAuthModeChange,
  handleAutoLoginChange,
  handleEmailChange,
  handlePasswordChange,
  handlePasswordConfirmChange,
  handlePrivacyPolicyAgreementChange,
  handleSubmit,
  isAuthReady,
  isAutoLoginChecked,
  isPrivacyPolicyAgreed,
  isSubmitting,
  password,
  passwordConfirm,
}: AccountAuthInlineProps) {
  const privacyPolicyAgreementId = useId();
  const [isPrivacyPolicyDialogOpen, setIsPrivacyPolicyDialogOpen] =
    useState(false);

  return (
    <div className={classNames.authInline}>
      <div className={classNames.modeTabs} aria-label="인증 방식">
        <button
          type="button"
          className={`${classNames.modeTab} ${
            authMode === "login" ? classNames.modeTabActive : ""
          }`}
          aria-pressed={authMode === "login"}
          onClick={() => handleAuthModeChange("login")}
        >
          로그인
        </button>
        <button
          type="button"
          className={`${classNames.modeTab} ${
            authMode === "signup" ? classNames.modeTabActive : ""
          }`}
          aria-pressed={authMode === "signup"}
          onClick={() => handleAuthModeChange("signup")}
        >
          회원가입
        </button>
      </div>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <label className={classNames.field}>
          <span>이메일</span>
          <input
            type="email"
            value={email}
            onChange={(event) => handleEmailChange(event.currentTarget.value)}
            placeholder="이메일을 입력하세요"
            autoComplete="email"
            required
          />
        </label>
        <label className={classNames.field}>
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => handlePasswordChange(event.currentTarget.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </label>
        {authMode === "signup" ? (
          <label className={classNames.field}>
            <span>비밀번호 확인</span>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(event) =>
                handlePasswordConfirmChange(event.currentTarget.value)
              }
              placeholder="비밀번호를 다시 입력하세요"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
        ) : null}
        {authMode === "signup" ? (
          <div className={classNames.checkboxField}>
            <input
              id={privacyPolicyAgreementId}
              type="checkbox"
              checked={isPrivacyPolicyAgreed}
              onChange={(event) =>
                handlePrivacyPolicyAgreementChange(event.currentTarget.checked)
              }
              required
            />
            <span>
              <label htmlFor={privacyPolicyAgreementId}>(필수) </label>
              <button
                type="button"
                onClick={() => setIsPrivacyPolicyDialogOpen(true)}
              >
                개인정보 처리방침
              </button>
              <label htmlFor={privacyPolicyAgreementId}>에 동의합니다.</label>
            </span>
          </div>
        ) : null}
        {authMode === "login" ? (
          <label className={classNames.checkboxField}>
            <input
              type="checkbox"
              checked={isAutoLoginChecked}
              onChange={(event) => handleAutoLoginChange(event.currentTarget.checked)}
            />
            <span>자동로그인</span>
          </label>
        ) : null}
        {!isAuthReady ? (
          <p className={classNames.submitMessage}>로그인 상태 확인 중입니다.</p>
        ) : null}
        {authMessage ? (
          <p className={classNames.submitMessage}>{authMessage}</p>
        ) : null}
        <button
          type="submit"
          className={classNames.submitButton}
          disabled={!canSubmit || isSubmitting || !isAuthReady}
        >
          {isSubmitting ? "처리 중" : authMode === "login" ? "로그인" : "회원가입"}
        </button>
        <Link href="/" className={classNames.secondaryButton}>
          비회원으로 둘러보기
        </Link>
      </form>
      {isPrivacyPolicyDialogOpen ? (
        <PrivacyPolicyDialog
          onClose={() => setIsPrivacyPolicyDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}
