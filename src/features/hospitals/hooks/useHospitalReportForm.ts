import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createHospitalReport } from "@/src/core/api/hospitals/hospitalReportsApi";
import { convertImageFileToWebp } from "@/src/features/images/convertImageFileToWebp";

export const HOSPITAL_REPORT_ANIMAL_OPTIONS = [
  "포유류",
  "양서류",
  "파충류",
  "조류",
  "어류",
] as const;
export const MAX_HOSPITAL_REPORT_FILE_COUNT = 3;

type UseHospitalReportFormOptions = {
  initialHospitalName?: string;
  initialStreetAddress?: string;
  onClose: () => void;
};

export function useHospitalReportForm({
  initialHospitalName = "",
  initialStreetAddress = "",
  onClose,
}: UseHospitalReportFormOptions) {
  const [hospitalName, setHospitalName] = useState(initialHospitalName);
  const [streetAddress, setStreetAddress] = useState(initialStreetAddress);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [animalSpecies, setAnimalSpecies] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [details, setDetails] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
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

  const clearSubmitFeedback = useCallback(() => {
    setSubmitMessage("");
    setSubmitError("");
  }, []);

  const resetFields = useCallback(() => {
    setHospitalName("");
    setStreetAddress("");
    setSelectedAnimals([]);
    setAnimalSpecies("");
    setContactInfo("");
    setDetails("");
    setMarketingConsent(false);
    setSelectedFiles([]);
    setFileLimitMessage("");
  }, []);

  const handleClose = useCallback(() => {
    resetFields();
    setIsSubmitting(false);
    clearSubmitFeedback();
    onClose();
  }, [clearSubmitFeedback, onClose, resetFields]);

  const toggleAnimal = useCallback(
    (animal: string) => {
      clearSubmitFeedback();
      setSelectedAnimals((current) =>
        current.includes(animal)
          ? current.filter((item) => item !== animal)
          : [...current, animal],
      );
    },
    [clearSubmitFeedback],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      clearSubmitFeedback();

      setIsSubmitting(true);

      try {
        await createHospitalReport({
          hospitalName,
          streetAddress,
          animalCategories: selectedAnimals,
          animalSpecies,
          contactInfo,
          details,
          marketingConsent,
          attachments: selectedFiles,
        });

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
    },
    [
      animalSpecies,
      clearSubmitFeedback,
      contactInfo,
      details,
      hospitalName,
      marketingConsent,
      resetFields,
      selectedAnimals,
      selectedFiles,
      streetAddress,
    ],
  );

  const handleSelectFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(event.currentTarget.files ?? []);
      event.currentTarget.value = "";

      const availableCount =
        MAX_HOSPITAL_REPORT_FILE_COUNT - selectedFiles.length;
      setFileLimitMessage(
        newFiles.length > availableCount
          ? `사진은 최대 ${MAX_HOSPITAL_REPORT_FILE_COUNT}개까지 첨부됩니다.`
          : "",
      );
      clearSubmitFeedback();

      const acceptedFiles = newFiles.slice(0, Math.max(availableCount, 0));
      if (acceptedFiles.length === 0) {
        return;
      }

      try {
        const webpFiles = await Promise.all(
          acceptedFiles.map((file) => convertImageFileToWebp(file)),
        );

        setSelectedFiles((currentFiles) =>
          [...currentFiles, ...webpFiles].slice(
            0,
            MAX_HOSPITAL_REPORT_FILE_COUNT,
          ),
        );
      } catch (error) {
        setFileLimitMessage(
          error instanceof Error
            ? error.message
            : "이미지를 WebP로 변환할 수 없습니다.",
        );
      }
    },
    [clearSubmitFeedback, selectedFiles],
  );

  const handleRemoveFile = useCallback(
    (targetIndex: number) => {
      setSelectedFiles((current) =>
        current.filter((_, index) => index !== targetIndex),
      );
      setFileLimitMessage("");
      clearSubmitFeedback();
    },
    [clearSubmitFeedback],
  );

  return {
    animalSpecies,
    clearSubmitFeedback,
    contactInfo,
    details,
    fileLimitMessage,
    handleClose,
    handleRemoveFile,
    handleSelectFiles,
    handleSubmit,
    hospitalName,
    isSubmitting,
    marketingConsent,
    selectedAnimals,
    selectedFilePreviews,
    selectedFiles,
    setAnimalSpecies,
    setContactInfo,
    setDetails,
    setHospitalName,
    setMarketingConsent,
    setStreetAddress,
    streetAddress,
    submitError,
    submitMessage,
    toggleAnimal,
  };
}
