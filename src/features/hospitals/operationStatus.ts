const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const CLOSED_DETAIL_PATTERN = /정기\s*휴무|휴무|쉬는|closed/i;
const CLOSED_STATUS_PATTERN = /접수\s*마감|진료\s*마감|영업\s*종료|운영\s*종료/i;
const OPEN_STATUS_PATTERN = /운영\s*중|진료\s*중|영업\s*중/i;
const TIME_RANGE_PATTERN =
  /((?:오전|오후|AM|PM)?\s*\d{1,2}(?::\d{2})?\s*시?)\s*(?:-|~|–|—)\s*((?:오전|오후|AM|PM)?\s*\d{1,2}(?::\d{2})?\s*시?)/gi;
const RECEPTION_DEADLINE_PATTERNS = [
  /((?:오전|오후|AM|PM)?\s*\d{1,2}(?::\d{2})?\s*시?)\s*접수\s*마감/i,
  /접수\s*마감\s*((?:오전|오후|AM|PM)?\s*\d{1,2}(?::\d{2})?\s*시?)/i,
];

export type HoursRow = {
  day: string;
  detail: string;
  isToday: boolean;
};

export type OperationStatus = "운영정보" | "휴무" | "운영중" | "진료마감";

export function isClosedOperationStatus(status: OperationStatus) {
  return status === "휴무" || status === "진료마감";
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  })
    .format(new Date())
    .slice(0, 1);
}

function splitHourEntry(entry: string, fallbackDay: string) {
  const normalizedEntry = entry.trim();
  const match = normalizedEntry.match(
    /^(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일)\s*[:：]?\s*(.*)$/,
  );

  if (!match) {
    return {
      day: fallbackDay,
      detail: normalizedEntry,
    };
  }

  return {
    day: match[1].slice(0, 1),
    detail: match[2].trim() || normalizedEntry,
  };
}

export function getHoursRows(hours?: string[]) {
  const todayLabel = getTodayLabel();
  const normalizedHours = (hours ?? []).filter((hour) => hour.trim().length > 0);

  return normalizedHours.map<HoursRow>((hour, index) => {
    const fallbackDay = WEEKDAY_LABELS[index] ?? "기타";
    const { day, detail } = splitHourEntry(hour, fallbackDay);

    return {
      day,
      detail,
      isToday: day === todayLabel,
    };
  });
}

function getCurrentKoreaMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const rawHour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const hour = rawHour === 24 ? 0 : rawHour;

  return hour * 60 + minute;
}

function parseTimeToMinutes(value: string) {
  const normalized = value.trim().toUpperCase();
  const periodMatch = normalized.match(/오전|오후|AM|PM/i);
  const timeMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?/);

  if (!timeMatch) {
    return null;
  }

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? 0);
  const period = periodMatch?.[0].toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  if (period === "오후" || period === "PM") {
    hour = hour === 12 ? 12 : hour + 12;
  }

  if (period === "오전" || period === "AM") {
    hour = hour === 12 ? 0 : hour;
  }

  return hour * 60 + minute;
}

function getOperatingRanges(detail: string) {
  const ranges: Array<{ opensAt: number; closesAt: number }> = [];
  const normalizedDetail = detail.replace(/\s+/g, " ");

  for (const match of normalizedDetail.matchAll(TIME_RANGE_PATTERN)) {
    const segmentStart = Math.max(0, (match.index ?? 0) - 12);
    const segmentEnd = Math.min(
      normalizedDetail.length,
      (match.index ?? 0) + match[0].length + 12,
    );
    const segment = normalizedDetail.slice(segmentStart, segmentEnd);

    if (/휴게|점심|브레이크|break/i.test(segment)) {
      continue;
    }

    const opensAt = parseTimeToMinutes(match[1]);
    const closesAt = parseTimeToMinutes(match[2]);

    if (opensAt === null || closesAt === null) {
      continue;
    }

    ranges.push({
      opensAt,
      closesAt: closesAt <= opensAt ? closesAt + 24 * 60 : closesAt,
    });
  }

  return ranges;
}

function getReceptionDeadline(detail: string) {
  for (const pattern of RECEPTION_DEADLINE_PATTERNS) {
    const match = detail.match(pattern);
    const deadline = match ? parseTimeToMinutes(match[1]) : null;

    if (deadline !== null) {
      return deadline;
    }
  }

  return null;
}

export function getOperationStatus(hoursRows: HoursRow[]): OperationStatus {
  const todayRow = hoursRows.find((row) => row.isToday);

  if (!todayRow) {
    return "운영정보";
  }

  const detail = todayRow.detail;

  if (CLOSED_DETAIL_PATTERN.test(detail)) {
    return "휴무";
  }

  const receptionDeadline = getReceptionDeadline(detail);
  const hasClosedStatus = CLOSED_STATUS_PATTERN.test(detail);

  if (hasClosedStatus && receptionDeadline === null) {
    return "진료마감";
  }

  if (/24\s*시간|24H|24\/7/i.test(detail)) {
    return "운영중";
  }

  const currentMinutes = getCurrentKoreaMinutes();

  if (receptionDeadline !== null && currentMinutes >= receptionDeadline) {
    return "진료마감";
  }

  const operatingRanges = getOperatingRanges(detail);

  if (operatingRanges.length > 0) {
    const isOpen = operatingRanges.some(({ opensAt, closesAt }) => {
      const normalizedCurrent =
        closesAt > 24 * 60 && currentMinutes < opensAt
          ? currentMinutes + 24 * 60
          : currentMinutes;

      return normalizedCurrent >= opensAt && normalizedCurrent < closesAt;
    });

    return isOpen ? "운영중" : "진료마감";
  }

  if (OPEN_STATUS_PATTERN.test(detail)) {
    return "운영중";
  }

  return "운영정보";
}

export function getHospitalOperationStatus(hours?: string[]) {
  return getOperationStatus(getHoursRows(hours));
}
