import { FormEvent, useState } from "react";
import styles from "@/src/shared/components/HospitalReportSheet.module.css";

const ANIMAL_OPTIONS = ["포유류", "양서류", "파충류", "조류", "어류"];

type HospitalReportSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HospitalReportSheet({
  isOpen,
  onClose,
}: HospitalReportSheetProps) {
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) {
    return null;
  }

  const toggleAnimal = (animal: string) => {
    setSubmitted(false);
    setSelectedAnimals((current) =>
      current.includes(animal)
        ? current.filter((item) => item !== animal)
        : [...current, animal],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="특수동물 진료 병원 제보"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.handle} />
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>병원제보</p>
            <h2 className={styles.title}>특수동물 진료 병원 제보</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            닫기
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>병원명</span>
            <input type="text" placeholder="병원명을 입력하세요" />
          </label>

          <label className={styles.field}>
            <span>병원주소</span>
            <input type="text" placeholder="주소를 입력하세요" />
          </label>

          <fieldset className={styles.fieldset}>
            <legend>진료 가능 동물</legend>
            <div className={styles.animalChoiceGrid}>
              {ANIMAL_OPTIONS.map((animal) => {
                const isSelected = selectedAnimals.includes(animal);
                return (
                  <button
                    key={animal}
                    type="button"
                    className={`${styles.animalChoiceButton} ${
                      isSelected ? styles.animalChoiceButtonActive : ""
                    }`}
                    onClick={() => toggleAnimal(animal)}
                    aria-pressed={isSelected}
                  >
                    {animal}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className={styles.field}>
            <span>인증 사진</span>
            <input type="file" accept="image/*" />
          </label>

          <label className={styles.field}>
            <span>더 많은 정보기</span>
            <textarea
              rows={5}
              placeholder="진료 경험, 가능한 동물 종류, 예약 방법 등 더 알려줄 내용을 적어주세요"
            />
          </label>

          <button type="submit" className={styles.submitButton}>
            제보하기
          </button>

          {submitted ? (
            <p className={styles.submitMessage}>
              제보 내용이 임시로 확인되었습니다. 실제 저장 API가 연결되면 여기서 제출됩니다.
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
