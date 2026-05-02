import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import styles from "@/src/shared/components/HospitalReportSheet.module.css";

const ANIMAL_OPTIONS = ["포유류", "양서류", "파충류", "조류", "어류"];
const MAX_FILE_COUNT = 3;

type HospitalReportSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function HospitalReportSheet({
  isOpen,
  onClose,
}: HospitalReportSheetProps) {
  const [hospitalName, setHospitalName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [animalSpecies, setAnimalSpecies] = useState("");
  const [details, setDetails] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileLimitMessage, setFileLimitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const selectedFilePreviews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [selectedFilePreviews]);

  if (!isOpen) {
    return null;
  }

  const clearSubmitFeedback = () => {
    setSubmitMessage("");
    setSubmitError("");
  };

  const resetFields = () => {
    setHospitalName("");
    setStreetAddress("");
    setSelectedAnimals([]);
    setAnimalSpecies("");
    setDetails("");
    setSelectedFiles([]);
    setFileLimitMessage("");
  };

  const handleClose = () => {
    resetFields();
    setIsSubmitting(false);
    clearSubmitFeedback();
    onClose();
  };

  const toggleAnimal = (animal: string) => {
    clearSubmitFeedback();
    setSelectedAnimals((current) =>
      current.includes(animal)
        ? current.filter((item) => item !== animal)
        : [...current, animal],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    clearSubmitFeedback();

    try {
      const response = await fetch("/api/hospital-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hospitalName,
          streetAddress,
          animalCategories: selectedAnimals,
          animalSpecies,
          details,
          attachments: selectedFiles.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          })),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "제보 저장에 실패했습니다.");
      }

      resetFields();
      setSubmitMessage(
        "제보가 저장되었습니다. 관리자 확인 전까지 병원 목록에는 공개되지 않습니다.",
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "제보 저장 중 알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.currentTarget.files ?? []);
    const availableCount = MAX_FILE_COUNT - selectedFiles.length;
    const nextFiles = [
      ...selectedFiles,
      ...newFiles.slice(0, Math.max(availableCount, 0)),
    ];

    setSelectedFiles(nextFiles);
    setFileLimitMessage(
      newFiles.length > availableCount
        ? `사진은 최대 ${MAX_FILE_COUNT}개까지 첨부됩니다.`
        : "",
    );
    clearSubmitFeedback();
    event.currentTarget.value = "";
  };

  const handleRemoveFile = (targetIndex: number) => {
    setSelectedFiles((current) =>
      current.filter((_, index) => index !== targetIndex),
    );
    setFileLimitMessage("");
    clearSubmitFeedback();
  };

  return (
    <div className={styles.overlay} role="presentation" onClick={handleClose}>
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
            <h2 className={styles.title}>특수동물 진료 병원 제보</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={handleClose}>
            닫기
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>병원명</span>
            <input
              type="text"
              placeholder="병원명을 입력하세요"
              value={hospitalName}
              onChange={(event) => {
                setHospitalName(event.currentTarget.value);
                clearSubmitFeedback();
              }}
              required
            />
          </label>

          <label className={styles.field}>
            <span>병원주소</span>
            <input
              type="text"
              placeholder="서울특별시 관악구 와 같이 대략적인 주소를 입력해주세요"
              value={streetAddress}
              onChange={(event) => {
                setStreetAddress(event.currentTarget.value);
                clearSubmitFeedback();
              }}
              required
            />
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
            <span>세부종</span>
            <input
              type="text"
              placeholder="예: 이구아나, 햄스터, 앵무새 등"
              value={animalSpecies}
              onChange={(event) => {
                setAnimalSpecies(event.currentTarget.value);
                clearSubmitFeedback();
              }}
            />
          </label>

          <div className={styles.field}>
            <span>인증 사진</span>
            <div className={styles.photoUploadRail}>
              <label
                className={`${styles.photoAddTile} ${
                  selectedFiles.length >= MAX_FILE_COUNT
                    ? styles.photoAddTileDisabled
                    : ""
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className={styles.fileInput}
                  onChange={handleSelectFiles}
                  disabled={selectedFiles.length >= MAX_FILE_COUNT}
                />
                <span>
                  {selectedFiles.length > 0 ? "사진 추가" : "선택"}
                </span>
                <small>
                  {selectedFiles.length}/{MAX_FILE_COUNT}
                </small>
              </label>

              {selectedFilePreviews.map(({ file, url }, index) => (
                <figure
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className={styles.photoPreviewCard}
                >
                  <Image
                    src={url}
                    alt={`${file.name} 미리보기`}
                    fill
                    sizes="118px"
                    unoptimized
                  />
                  <button
                    type="button"
                    className={styles.photoRemoveButton}
                    onClick={() => handleRemoveFile(index)}
                    aria-label={`${file.name} 삭제`}
                  >
                    ×
                  </button>
                </figure>
              ))}
            </div>
            {fileLimitMessage ? (
              <p className={styles.fileLimitMessage}>{fileLimitMessage}</p>
            ) : null}
          </div>

          <label className={styles.field}>
            <span>더 많은 정보기록</span>
            <textarea
              rows={5}
              placeholder="진료 경험, 가능한 동물 종류, 예약 방법 등 더 알려줄 내용을 적어주세요"
              value={details}
              onChange={(event) => {
                setDetails(event.currentTarget.value);
                clearSubmitFeedback();
              }}
            />
          </label>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "저장 중" : "제보하기"}
          </button>

          {submitMessage ? (
            <p className={styles.submitMessage}>
              {submitMessage}
            </p>
          ) : null}

          {submitError ? (
            <p className={styles.submitError}>
              {submitError}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
