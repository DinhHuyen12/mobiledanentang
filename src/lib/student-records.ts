export type ScholarshipAwardItem = {
  id: number;
  scholarship_id?: number;
  scholarship_name?: string;
  amount?: number;
  student_id?: number;
  student_name?: string;
  student_email?: string;
  awarded_date?: string;
  note?: string;
  status?: string;
};

export type DisciplinaryActionItem = {
  id: number;
  student_id?: number;
  student_name?: string;
  student_email?: string;
  class_id?: number;
  class_name?: string;
  semester_id?: number;
  semester_name?: string;
  title?: string;
  description?: string;
  level?: string;
  decision_date?: string;
  status?: string;
  decided_by?: number;
  decided_by_name?: string;
};

export function formatStudentRecordDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10) || "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatScholarshipMoney(value?: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function getScholarshipStatusClassName(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "granted") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700";
  }
  if (normalized === "rejected" || normalized === "cancelled" || normalized === "canceled") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-slate-100 text-slate-700";
}

export function getScholarshipStatusLabel(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "granted") return "Đã cấp";
  if (normalized === "pending") return "Đang xét";
  if (normalized === "rejected") return "Từ chối";
  if (normalized === "cancelled" || normalized === "canceled") return "Đã hủy";
  return status || "Chưa cập nhật";
}

export function getDisciplinaryLevelClassName(level?: string) {
  const normalized = String(level || "").trim().toLowerCase();
  if (
    normalized.includes("nhac") ||
    normalized.includes("minor") ||
    normalized.includes("warning")
  ) {
    return "bg-amber-50 text-amber-700";
  }
  if (
    normalized.includes("nang") ||
    normalized.includes("major") ||
    normalized.includes("serious") ||
    normalized.includes("suspend")
  ) {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-slate-100 text-slate-700";
}

export function getDisciplinaryStatusLabel(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "active" || normalized === "effective") return "Đang hiệu lực";
  if (normalized === "resolved" || normalized === "completed") return "Đã xử lý";
  if (normalized === "cancelled" || normalized === "canceled") return "Đã hủy";
  return status || "Chưa cập nhật";
}

