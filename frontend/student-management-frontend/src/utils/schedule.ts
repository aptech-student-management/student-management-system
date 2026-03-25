export const SCHEDULE_DAYS = [
  { value: "2", label: "Thứ 2" },
  { value: "3", label: "Thứ 3" },
  { value: "4", label: "Thứ 4" },
  { value: "5", label: "Thứ 5" },
  { value: "6", label: "Thứ 6" },
  { value: "7", label: "Thứ 7" }
];

export const TIME_SLOTS = [
  { value: "07:00-09:30", label: "Ca 1 (07:00-09:30)", period: "1-3" },
  { value: "09:40-12:00", label: "Ca 2 (09:40-12:00)", period: "4-6" },
  { value: "13:00-15:30", label: "Ca 3 (13:00-15:30)", period: "7-9" },
  { value: "15:40-18:00", label: "Ca 4 (15:40-18:00)", period: "10-12" }
];

export const DEFAULT_TIME_SLOT = TIME_SLOTS[0].value;

const formatDateLabel = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh"
  });
};

export const buildScheduleValue = (scheduleDate: string, timeRange: string) => {
  if (!scheduleDate || !timeRange) return "";
  return `${scheduleDate} ${timeRange}`;
};

export const parseScheduleValue = (schedule?: string) => {
  if (!schedule) {
    return {
      scheduleDate: "",
      timeRange: "",
      dayLabel: "",
      dateLabel: "",
      timeLabel: "",
      periodLabel: "",
      day: ""
    };
  }

  const compact = schedule.trim();
  const datedMatch = compact.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}-\d{2}:\d{2})$/);

  if (datedMatch) {
    const scheduleDate = datedMatch[1];
    const timeRange = datedMatch[2];
    const dateObject = new Date(`${scheduleDate}T00:00:00`);
    const jsDay = dateObject.getDay();
    const dayOfWeek = jsDay === 0 ? "8" : String(jsDay + 1);
    const dayLabel = SCHEDULE_DAYS.find((item) => item.value === dayOfWeek)?.label
      ?? `Thứ ${dayOfWeek}`;
    const slot = TIME_SLOTS.find((item) => item.value === timeRange);

    return {
      scheduleDate,
      timeRange,
      dayLabel,
      dateLabel: formatDateLabel(scheduleDate),
      timeLabel: timeRange,
      periodLabel: slot?.period ?? "",
      day: dayLabel
    };
  }

  const modernMatch = compact.match(/^T([2-7])\s+(\d{2}:\d{2}-\d{2}:\d{2})$/i);

  if (modernMatch) {
    const scheduleDate = "";
    const timeRange = modernMatch[2];
    const dayOfWeek = modernMatch[1];
    const dayLabel = SCHEDULE_DAYS.find((item) => item.value === dayOfWeek)?.label ?? `Thứ ${dayOfWeek}`;
    const slot = TIME_SLOTS.find((item) => item.value === timeRange);

    return {
      scheduleDate,
      timeRange,
      dayLabel,
      dateLabel: "",
      timeLabel: timeRange,
      periodLabel: slot?.period ?? "",
      day: dayLabel
    };
  }

  const legacyDayMatch = compact.match(/Thứ\s+([2-7])/i);
  const legacyPeriodMatch = compact.match(/Tiết\s+(\d+-\d+)/i);

  if (legacyDayMatch && legacyPeriodMatch) {
    const dayOfWeek = legacyDayMatch[1];
    const periodLabel = legacyPeriodMatch[1];
    const slot = TIME_SLOTS.find((item) => item.period === periodLabel);

    return {
      scheduleDate: "",
      timeRange: slot?.value ?? "",
      dayLabel: `Thứ ${dayOfWeek}`,
      dateLabel: "",
      timeLabel: slot?.value ?? periodLabel,
      periodLabel,
      day: `Thứ ${dayOfWeek}`
    };
  }

  return {
    scheduleDate: "",
    timeRange: "",
    dayLabel: compact,
    dateLabel: "",
    timeLabel: compact,
    periodLabel: "",
    day: compact
  };
};
