"use client";

import api from "@/lib/api";
import { getAuthToken, parseAuthToken } from "@/lib/auth";
import {
  BackendScheduleItem,
  formatScheduleTime,
  getScheduleDayLabel,
} from "@/lib/schedules";

export type StudentInfo = {
  id: number;
  user_id?: number;
  username?: string;
  email?: string;
  full_name?: string;
  class_id?: number;
  class_name?: string;
  enrollment_date?: string;
  status?: string;
};

export type EnrollmentItem = {
  id: number;
  student_id?: number;
  student_name?: string;
  course_section_id?: number;
  subject_id?: number;
  subject_name?: string;
  semester_id?: number;
  semester_name?: string;
  status?: string;
  is_retake?: boolean;
  is_improvement?: boolean;
  enrollment_type?: "hoc_di" | "hoc_lai" | "hoc_cai_thien" | string;
  lecturer_name?: string;
  room?: string;
  schedule?: string;
};

export type GradeItem = {
  id: number;
  enrollment_id?: number;
  student_name?: string;
  subject_name?: string;
  attendance_score?: number;
  midterm_score?: number;
  final_score?: number;
  total_score?: number;
  letter_grade?: string;
};

export type CourseSectionItem = {
  id: number;
  subject_name?: string;
  subject?: string;
  subject_id?: number;
  semester_id?: number;
  semester_name?: string;
  semester?: string;
  lecturer_name?: string;
  lecturer?: string;
  lecturer_id?: number;
  room?: string;
  schedule?: string;
  max_students?: number;
  current_students?: number;
  is_retake?: boolean;
  is_improvement?: boolean;
  enrollment_type?: "hoc_di" | "hoc_lai" | "hoc_cai_thien" | string;
  is_registered?: boolean;
};

function getCollection(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
}

export { getCollection };

type SectionDisplayInfo = {
  lecturer_name?: string;
  room?: string;
  schedule?: string;
};

function buildSectionDisplayMap(schedules: BackendScheduleItem[]) {
  const grouped = new Map<number, BackendScheduleItem[]>();

  schedules.forEach((item) => {
    const sectionId = Number(item.course_section_id);
    if (!Number.isFinite(sectionId)) return;
    const list = grouped.get(sectionId) || [];
    list.push(item);
    grouped.set(sectionId, list);
  });

  const displayMap = new Map<number, SectionDisplayInfo>();

  grouped.forEach((items, sectionId) => {
    const lecturerName = items.find((item) => item.lecturer_name)?.lecturer_name || "";
    const room = Array.from(new Set(items.map((item) => item.room).filter(Boolean))).join(", ");
    const schedule = items
      .map(
        (item) =>
          `${getScheduleDayLabel(item.day_of_week)} ${formatScheduleTime(
            item.start_time
          )}-${formatScheduleTime(item.end_time)}`
      )
      .join(" | ");

    displayMap.set(sectionId, {
      lecturer_name: lecturerName,
      room,
      schedule,
    });
  });

  return displayMap;
}

export async function loadStudentPortalData() {
  const token = getAuthToken();
  const authUser = parseAuthToken(token);

  if (!authUser?.id) {
    throw new Error("Khong tim thay thong tin dang nhap");
  }

  const [studentsRes, enrollmentsRes, gradesRes, schedulesRes] = await Promise.all([
    api.get("/student-info"),
    api.get("/enrollments"),
    api.get("/grades"),
    api.get("/schedules"),
  ]);

  const studentList = getCollection(studentsRes.data) as StudentInfo[];
  const enrollmentList = getCollection(enrollmentsRes.data) as EnrollmentItem[];
  const gradeList = getCollection(gradesRes.data) as GradeItem[];
  const scheduleList = getCollection(schedulesRes.data) as BackendScheduleItem[];
  const sectionDisplayMap = buildSectionDisplayMap(scheduleList);

  const currentStudent =
    studentList.find((student) => Number(student.user_id) === Number(authUser.id)) || null;

  if (!currentStudent) {
    return {
      studentInfo: null,
      enrollments: [] as EnrollmentItem[],
      grades: [] as GradeItem[],
    };
  }

  const studentEnrollments = enrollmentList
    .filter((item) => Number(item.student_id) === Number(currentStudent.id))
    .map((item) => {
      const sectionInfo = sectionDisplayMap.get(Number(item.course_section_id));
      return {
        ...item,
        lecturer_name: sectionInfo?.lecturer_name || item.lecturer_name || "",
        room: sectionInfo?.room || item.room || "",
        schedule: sectionInfo?.schedule || item.schedule || "",
      };
    });
  const enrollmentIds = new Set(studentEnrollments.map((item) => Number(item.id)));
  const studentGrades = gradeList.filter((item) =>
    enrollmentIds.has(Number(item.enrollment_id))
  );

  return {
    studentInfo: currentStudent,
    enrollments: studentEnrollments,
    grades: studentGrades,
  };
}

export function getAverageScore(grades: GradeItem[]) {
  if (grades.length === 0) return "0.0";
  const total = grades.reduce((sum, item) => sum + Number(item.total_score || 0), 0);
  return (total / grades.length).toFixed(1);
}

export function getEnrollmentTypeFromBestScore(bestScore?: number | null) {
  if (bestScore == null || Number.isNaN(Number(bestScore))) {
    return "hoc_di";
  }

  const normalizedScore = Number(bestScore);
  if (normalizedScore < 5) return "hoc_lai";
  if (normalizedScore <= 8) return "hoc_cai_thien";
  return "hoc_di";
}

type EnrollmentTypeSource =
  | string
  | {
      enrollment_type?: string;
      is_retake?: boolean;
      is_improvement?: boolean;
      best_score?: number | null;
    }
  | null
  | undefined;

export function resolveEnrollmentType(source?: EnrollmentTypeSource) {
  if (source && typeof source === "object") {
    const normalized = String(source.enrollment_type || "").trim().toLowerCase();
    if (normalized === "hoc_lai" || normalized === "hoc_cai_thien" || normalized === "hoc_di") {
      return normalized;
    }
    if (source.is_retake) return "hoc_lai";
    if (source.is_improvement) return "hoc_cai_thien";
    if (source.best_score != null) return getEnrollmentTypeFromBestScore(source.best_score);
    return "hoc_di";
  }

  const normalized = String(source || "").trim().toLowerCase();
  if (normalized === "hoc_lai" || normalized === "hoc_cai_thien" || normalized === "hoc_di") {
    return normalized;
  }
  return "hoc_di";
}

export function getEnrollmentTypeLabel(source?: EnrollmentTypeSource) {
  const normalized = resolveEnrollmentType(source);
  if (normalized === "hoc_lai") return "Hoc lai";
  if (normalized === "hoc_cai_thien") return "Hoc cai thien";
  return "Hoc di";
}

export function getEnrollmentTypeClassName(source?: EnrollmentTypeSource) {
  const normalized = resolveEnrollmentType(source);
  if (normalized === "hoc_lai") return "bg-rose-50 text-rose-700";
  if (normalized === "hoc_cai_thien") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

export function normalizeEnrollmentStatus(status?: string) {
  return String(status || "").trim().toLowerCase();
}

export function isActiveEnrollmentStatus(status?: string) {
  const normalized = normalizeEnrollmentStatus(status);
  return normalized === "active" || normalized === "dang hoc";
}

export function isCancelledEnrollmentStatus(status?: string) {
  const normalized = normalizeEnrollmentStatus(status);
  return normalized === "cancelled" || normalized === "canceled" || normalized === "dropped";
}

export function isStudentRegistrationType(source?: EnrollmentTypeSource) {
  const normalized = resolveEnrollmentType(source);
  return normalized === "hoc_lai" || normalized === "hoc_cai_thien";
}
