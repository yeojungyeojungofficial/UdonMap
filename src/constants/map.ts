export const INITIAL_HOSPITAL_MAP_LEVEL = 7;

/** 「전체」 필터 — 이 줌 레벨 이하부터 권역 숫자 대신 병원 마커 표시 */
export const ALL_REGION_MARKER_MAX_LEVEL = 8;

/** 「전체」 필터 선택 시 단일 병원 포커스 줌 (낮을수록 가까움) */
export const HOSPITAL_FOCUS_SINGLE_LEVEL = 4;

/** 「전체」 필터 — setBounds 후 추가로 당길 줌 단계 */
export const HOSPITAL_FOCUS_BOUNDS_ZOOM_IN = 1;

/** 「전체」 필터 — setBounds 포커스 시 최소 줌 레벨 */
export const HOSPITAL_FOCUS_BOUNDS_MIN_LEVEL = 3;

/** 「전체」 필터 — setBounds 여백(px), 작을수록 더 가깝게 맞춤 */
export const HOSPITAL_FOCUS_BOUNDS_PADDING = 32;
