export type AttendanceSessionItem = {
  id: number;
  course_section_id?: number;
  subject_name?: string;
  semester_name?: string;
  session_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  room?: string | null;
  topic?: string | null;
  status?: string | null;
};

export type AttendanceRecordItem = {
  enrollment_id: number;
  student_id?: number;
  student_name?: string;
  student_email?: string;
  attendance_record_id?: number | null;
  status?: string | null;
  check_in_time?: string | null;
  note?: string | null;
};

export type AttendanceSessionRecordsResponse = {
  session?: AttendanceSessionItem;
  records?: AttendanceRecordItem[];
};

export function getAttendanceStatusLabel(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "present") return "Co mat";
  if (normalized === "late") return "Di muon";
  if (normalized === "absent") return "Vang";
  if (normalized === "excused") return "Co phep";
  return status || "Chua cap nhat";
}

export function getAttendanceStatusClassName(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "present") return "bg-emerald-50 text-emerald-700";
  if (normalized === "late") return "bg-amber-50 text-amber-700";
  if (normalized === "absent") return "bg-rose-50 text-rose-700";
  if (normalized === "excused") return "bg-slate-100 text-slate-700";
  return "bg-slate-100 text-slate-700";
}
