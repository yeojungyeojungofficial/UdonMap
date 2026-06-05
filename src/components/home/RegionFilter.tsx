import FilterChipGroup from "@/src/components/common/FilterChipGroup";
import ExpandableFilterChipGroup from "@/src/components/common/mob/ExpandableFilterChipGroup";
import type { Region } from "@/src/features/hospitals/types";

type RegionFilterProps = {
  regions: readonly Region[];
  selectedRegion: Region;
  onSelectRegion: (region: Region) => void;
  /** 접었다 펼치는 행 + 전체보기 토글 (모바일 홈 등) */
  expandable?: boolean;
};

export default function RegionFilter({
  regions,
  selectedRegion,
  onSelectRegion,
  expandable = false,
}: RegionFilterProps) {
  if (expandable) {
    return (
      <ExpandableFilterChipGroup
        ariaLabel="지역 필터"
        hint="지역 필터링을 할 수 있습니다"
        options={regions}
        selectedOption={selectedRegion}
        onSelectOption={onSelectRegion}
      />
    );
  }

  return (
    <FilterChipGroup
      ariaLabel="지역 필터"
      options={regions}
      selectedOption={selectedRegion}
      onSelectOption={onSelectRegion}
    />
  );
}
