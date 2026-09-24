export type BackendScheduleItem = {
  id: number;
  course_section_id?: number;
  subject_id?: number;
  subject_name?: string;
  lecturer_id?: number;
  lecturer_name?: string;
  semester_id?: number;
  semester_name?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  created_at?: string;
};

const DAY_ALIASES: Record<string, keyof typeof DAY_ORDER> = {
  "2": "monday",
  "thu2": "monday",
  "thu_2": "monday",
  "thuhai": "monday",
  monday: "monday",
  "3": "tuesday",
  "thu3": "tuesday",
  "thu_3": "tuesday",
  "thuba": "tuesday",
  tuesday: "tuesday",
  "4": "wednesday",
  "thu4": "wednesday",
  "thu_4": "wednesday",
  "thutu": "wednesday",
  wednesday: "wednesday",
  "5": "thursday",
  "thu5": "thursday",
  "thu_5": "thursday",
  "thunam": "thursday",
  thursday: "thursday",
  "6": "friday",
  "thu6": "friday",
  "thu_6": "friday",
  "thusau": "friday",
  friday: "friday",
  "7": "saturday",
  "thu7": "saturday",
  "thu_7": "saturday",
  "thubay": "saturday",
  saturday: "saturday",
  cn: "sunday",
  "chu nhat": "sunday",
  chunhat: "sunday",
  "chu_nhat": "sunday",
  sunday: "sunday",
};

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

const DAY_LABEL: Record<string, string> = {
  monday: "Thu 2",
  tuesday: "Thu 3",
  wednesday: "Thu 4",
  thursday: "Thu 5",
  friday: "Thu 6",
  saturday: "Thu 7",
  sunday: "Chu nhat",
};

export function normalizeScheduleDay(dayOfWeek?: string) {
  const normalized = String(dayOfWeek || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

  return DAY_ALIASES[normalized];
}

export function getScheduleDayOrder(dayOfWeek?: string) {
  const normalized = normalizeScheduleDay(dayOfWeek);
  return DAY_ORDER[normalized || ""] ?? 999;
}

export function getScheduleDayLabel(dayOfWeek?: string) {
  const normalized = normalizeScheduleDay(dayOfWeek);
  return DAY_LABEL[normalized || ""] || dayOfWeek || "Chua ro thu";
}

export function formatScheduleTime(value?: string) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}
