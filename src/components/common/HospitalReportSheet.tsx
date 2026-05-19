import Image from "next/image";
import {
  HOSPITAL_REPORT_ANIMAL_OPTIONS,
  MAX_HOSPITAL_REPORT_FILE_COUNT,
  useHospitalReportForm,
} from "@/src/features/hospitals/hooks/useHospitalReportForm";
import styles from "@/src/components/common/HospitalReportSheet.module.css";

type HospitalReportSheetProps = {
  initialHospitalName?: string;
  initialStreetAddress?: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function HospitalReportSheet({
  initialHospitalName,
  initialStreetAddress,
  isOpen,
  onClose,
}: HospitalReportSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <HospitalReportSheetContent
      initialHospitalName={initialHospitalName}
      initialStreetAddress={initialStreetAddress}
      onClose={onClose}
    />
  );
}

function HospitalReportSheetContent({
  initialHospitalName,
  initialStreetAddress,
  onClose,
}: Omit<HospitalReportSheetProps, "isOpen">) {
  const {
    animalSpecies,
    clearSubmitFeedback,
    details,
    fileLimitMessage,
    handleClose,
    handleRemoveFile,
    handleSelectFiles,
    handleSubmit,
    hospitalName,
    isSubmitting,
    selectedAnimals,
    selectedFilePreviews,
    selectedFiles,
    setAnimalSpecies,
    setDetails,
    setHospitalName,
    setStreetAddress,
    streetAddress,
    submitError,
    submitMessage,
    toggleAnimal,
  } = useHospitalReportForm({
    initialHospitalName,
    initialStreetAddress,
    onClose,
  });

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
              {HOSPITAL_REPORT_ANIMAL_OPTIONS.map((animal) => {
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
                  selectedFiles.length >= MAX_HOSPITAL_REPORT_FILE_COUNT
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
                  disabled={
                    selectedFiles.length >= MAX_HOSPITAL_REPORT_FILE_COUNT
                  }
                />
                <span>
                  {selectedFiles.length > 0 ? "사진 추가" : "선택"}
                </span>
                <small>
                  {selectedFiles.length}/{MAX_HOSPITAL_REPORT_FILE_COUNT}
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
