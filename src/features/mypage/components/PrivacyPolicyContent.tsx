import { PRIVACY_POLICY_EFFECTIVE_DATE_LABEL } from "@/src/features/mypage/privacyPolicy";

type PrivacyPolicyContentProps = {
  classNames: Readonly<Record<string, string>>;
};

export default function PrivacyPolicyContent({
  classNames,
}: PrivacyPolicyContentProps) {
  return (
    <article className={classNames.policyContent}>
      <p>
        여정은 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등
        관련 법령을 준수하기 위해 다음과 같이 개인정보처리방침을 공개합니다.
      </p>

      <section className={classNames.policySection}>
        <h2>1. 수집하는 개인정보 항목</h2>
        <p>
          여정은 이벤트 참여 및 경품 발송을 위해 다음의 개인정보를 수집합니다.
        </p>
        <ul>
          <li>이메일 주소</li>
          <li>전화번호</li>
        </ul>
      </section>

      <section className={classNames.policySection}>
        <h2>2. 개인정보의 수집 및 이용 목적</h2>
        <p>여정은 수집한 개인정보를 다음의 목적을 위해 이용합니다.</p>
        <ul>
          <li>이벤트 참여자 확인</li>
          <li>이벤트 당첨자 확인</li>
          <li>경품 발송 및 관련 안내</li>
          <li>중복 참여 또는 부정 참여 방지</li>
        </ul>
      </section>

      <section className={classNames.policySection}>
        <h2>3. 개인정보의 보유 및 이용 기간</h2>
        <p>
          여정은 수집한 이메일 주소 및 전화번호를 이벤트 운영 및 경품 발송 완료
          시까지 보유 및 이용합니다.
        </p>
        <p>
          이벤트 종료 후 경품 발송이 완료되면 수집한 개인정보를 지체 없이
          파기합니다.
        </p>
        <p>
          단, 이용자가 개인정보 삭제를 요청하는 경우 경품 발송 등 처리에 필요한
          경우를 제외하고 지체 없이 해당 개인정보를 파기합니다.
        </p>
      </section>

      <section className={classNames.policySection}>
        <h2>4. 개인정보의 제3자 제공</h2>
        <p>여정은 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.</p>
        <p>다만, 다음의 경우에는 예외적으로 개인정보를 제공할 수 있습니다.</p>
        <ul>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령에 따라 제공이 요구되는 경우</li>
        </ul>
      </section>

      <section className={classNames.policySection}>
        <h2>5. 개인정보 처리의 위탁</h2>
        <p>
          여정은 서비스 운영 및 개인정보 저장을 위해 다음과 같이 개인정보 처리
          업무를 외부 서비스에 위탁합니다.
        </p>
        <ul>
          <li>수탁업체: Supabase</li>
          <li>위탁 업무 내용: 이메일 주소 및 전화번호 저장, 데이터베이스 운영 및 관리</li>
          <li>보유 및 이용 기간: 이벤트 운영 및 경품 발송 완료 시까지</li>
        </ul>
        <p>
          여정은 위탁받은 업체가 개인정보를 안전하게 처리할 수 있도록 필요한
          사항을 관리합니다.
        </p>
      </section>

      <section className={classNames.policySection}>
        <h2>6. 개인정보의 국외 이전</h2>
        <p>
          여정은 Supabase를 이용하여 이메일 주소 및 전화번호를 저장하며,
          Supabase의 서버 위치 및 서비스 운영 방식에 따라 개인정보가 국외에서
          저장 또는 처리될 수 있습니다.
        </p>
        <ul>
          <li>이전되는 개인정보 항목: 이메일 주소, 전화번호</li>
          <li>이전 목적: 이벤트 운영, 당첨자 확인, 경품 발송 및 데이터베이스 저장</li>
          <li>이전받는 자: Supabase</li>
          <li>보유 및 이용 기간: 이벤트 운영 및 경품 발송 완료 시까지</li>
        </ul>
      </section>

      <section className={classNames.policySection}>
        <h2>7. 개인정보의 파기 절차 및 방법</h2>
        <p>
          여정은 개인정보의 보유 및 이용 기간이 경과하거나 처리 목적이 달성된
          경우 해당 개인정보를 지체 없이 파기합니다.
        </p>
        <p>전자적 파일 형태의 개인정보는 복구할 수 없는 방법으로 삭제합니다.</p>
      </section>

      <section className={classNames.policySection}>
        <h2>8. 이용자의 권리</h2>
        <p>
          이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제, 처리정지를
          요청할 수 있습니다.
        </p>
        <p>
          개인정보 관련 요청은 아래 개인정보 문의처를 통해 접수할 수 있습니다.
        </p>
      </section>

      <section className={classNames.policySection}>
        <h2>9. 개인정보 관련 문의</h2>
        <p>개인정보 처리와 관련한 문의는 아래 연락처로 문의해 주시기 바랍니다.</p>
        <ul>
          <li>담당자: 여정팀</li>
          <li>
            이메일:{" "}
            <a href="mailto:yeojungofficial@gmail.com">
              yeojungofficial@gmail.com
            </a>
          </li>
        </ul>
      </section>

      <section className={classNames.policySection}>
        <h2>10. 개인정보처리방침의 변경</h2>
        <p>
          본 개인정보처리방침은 관련 법령 또는 서비스 운영 방침에 따라 변경될 수
          있습니다.
        </p>
        <p>변경 사항이 있는 경우 웹사이트를 통해 공지합니다.</p>
      </section>

      <p className={classNames.policyEffectiveDate}>
        시행일자: {PRIVACY_POLICY_EFFECTIVE_DATE_LABEL}
      </p>
    </article>
  );
}
