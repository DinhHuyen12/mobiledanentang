"use client";

import api from "@/lib/api";
import { getAuthToken, parseAuthToken } from "@/lib/auth";
import { getCollection, CourseSectionItem } from "@/lib/student-portal";
import { formatScheduleTime, getScheduleDayLabel } from "@/lib/schedules";

export type LecturerInfo = {
  id: number;
  user_id?: number;
  username?: string;
  email?: string;
  full_name?: string;
  lecturer_code?: string;
  academic_rank?: string;
  specialization?: string;
};

export type ScheduleItem = {
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
};

function buildLecturerSectionDisplayMap(schedules: ScheduleItem[]) {
  const grouped = new Map<number, ScheduleItem[]>();

  schedules.forEach((item) => {
    const sectionId = Number(item.course_section_id);
    if (!Number.isFinite(sectionId)) return;
    const list = grouped.get(sectionId) || [];
    list.push(item);
    grouped.set(sectionId, list);
  });

  const displayMap = new Map<
    number,
    {
      room?: string;
      schedule?: string;
      lecturer_name?: string;
    }
  >();

  grouped.forEach((items, sectionId) => {
    displayMap.set(sectionId, {
      lecturer_name: items.find((item) => item.lecturer_name)?.lecturer_name || "",
      room: Array.from(new Set(items.map((item) => item.room).filter(Boolean))).join(", "),
      schedule: items
        .map(
          (item) =>
            `${getScheduleDayLabel(item.day_of_week)} ${formatScheduleTime(
              item.start_time
            )}-${formatScheduleTime(item.end_time)}`
        )
        .join(" | "),
    });
  });

  return displayMap;
}

export async function loadLecturerPortalData() {
  const token = getAuthToken();
  const authUser = parseAuthToken(token);

  if (!authUser?.id) {
    throw new Error("Khong tim thay thong tin dang nhap");
  }

  const [lecturerRes, sectionsRes, schedulesRes] = await Promise.all([
    api.get("/lecturer-info"),
    api.get("/course-sections"),
    api.get("/schedules"),
  ]);

  const lecturerList = getCollection(lecturerRes.data) as LecturerInfo[];
  const sectionList = getCollection(sectionsRes.data) as CourseSectionItem[];
  const scheduleList = getCollection(schedulesRes.data) as ScheduleItem[];

  const currentLecturer =
    lecturerList.find((item) => Number(item.user_id) === Number(authUser.id)) || null;

  if (!currentLecturer) {
    return {
      lecturerInfo: null,
      courseSections: [] as CourseSectionItem[],
      schedules: [] as ScheduleItem[],
    };
  }

  const lecturerSectionDisplayMap = buildLecturerSectionDisplayMap(scheduleList);
  const lecturerSections = sectionList
    .filter((item) => Number(item.lecturer_id) === Number(currentLecturer.id))
    .map((item) => {
      const display = lecturerSectionDisplayMap.get(Number(item.id));
      return {
        ...item,
        lecturer_name: display?.lecturer_name || item.lecturer_name || currentLecturer.full_name || "",
        room: display?.room || item.room || "",
        schedule: display?.schedule || item.schedule || "",
      };
    });
  const sectionIds = new Set(lecturerSections.map((item) => Number(item.id)));
  const lecturerSchedules = scheduleList.filter((item) =>
    sectionIds.has(Number(item.course_section_id))
  );

  return {
    lecturerInfo: currentLecturer,
    courseSections: lecturerSections,
    schedules: lecturerSchedules,
  };
}
