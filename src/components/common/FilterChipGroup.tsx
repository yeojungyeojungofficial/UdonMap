import styles from "@/src/components/common/FilterChipGroup.module.css";

type FilterChipGroupProps<Option extends string> = {
  ariaLabel: string;
  className?: string;
  onSelectOption: (option: Option) => void;
  options: readonly Option[];
  selectedOption: Option | null;
};

export default function FilterChipGroup<Option extends string>({
  ariaLabel,
  className,
  onSelectOption,
  options,
  selectedOption,
}: FilterChipGroupProps<Option>) {
  return (
    <div
      className={`${styles.chipGroup} ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = selectedOption === option;

        return (
          <button
            key={option}
            type="button"
            className={`${styles.chipButton} ${
              isActive ? styles.chipButtonActive : ""
            }`}
            onClick={() => onSelectOption(option)}
            aria-pressed={isActive}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
