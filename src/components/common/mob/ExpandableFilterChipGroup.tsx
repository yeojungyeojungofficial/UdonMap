import { useState } from "react";
import styles from "@/src/components/common/mob/expandableFilter.module.css";

type ExpandableFilterChipGroupProps<Option extends string> = {
  ariaLabel: string;
  closeLabel?: string;
  hint: string;
  onSelectOption: (option: Option) => void;
  openLabel?: string;
  options: readonly Option[];
  rowClassName?: string;
  selectedOption: Option | null;
};

export default function ExpandableFilterChipGroup<Option extends string>({
  ariaLabel,
  closeLabel = "접기",
  hint,
  onSelectOption,
  openLabel = "전체보기",
  options,
  rowClassName,
  selectedOption,
}: ExpandableFilterChipGroupProps<Option>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={`${styles.filterRow} ${rowClassName ?? ""}`}>
        {isOpen ? null : <span className={styles.filterHint}>{hint}</span>}
        <button
          type="button"
          className={`${styles.filterToggle} ${
            isOpen ? styles.filterToggleOpen : ""
          }`}
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
        >
          {isOpen ? closeLabel : openLabel}
        </button>
      </div>
      {isOpen ? (
        <div className={styles.filterChips} aria-label={ariaLabel}>
          {options.map((option) => {
            const isActive = selectedOption === option;

            return (
              <button
                key={option}
                type="button"
                className={`${styles.filterChip} ${
                  isActive ? styles.filterChipActive : ""
                }`}
                onClick={() => {
                  onSelectOption(option);
                  setIsOpen(false);
                }}
                aria-pressed={isActive}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
