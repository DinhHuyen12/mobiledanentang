export type TuitionItem = {
  id: number;
  student_id?: number;
  student_name?: string;
  student_email?: string;
  semester_id?: number;
  semester_name?: string;
  total_credits?: number;
  amount?: number;
  paid_amount?: number;
  status?: string;
  due_date?: string;
  created_at?: string;
};

export type TuitionPaymentItem = {
  id: number;
  tuition_id?: number;
  student_id?: number;
  student_name?: string;
  student_email?: string;
  semester_id?: number;
  semester_name?: string;
  payment_date?: string;
  amount?: number;
  payment_method?: string;
  note?: string;
  created_at?: string;
};

export type PaymentMethodOption = {
  code?: string;
  name?: string;
  description?: string;
};

export type TuitionPaymentsResponse = {
  tuition?: TuitionItem;
  payments?: TuitionPaymentItem[];
};

export type TuitionPaymentMethodsResponse = {
  tuition?: TuitionItem & {
    remaining_amount?: number;
  };
  methods?: PaymentMethodOption[];
};

export function getApiCollection(payload: unknown) {
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

export function getTuitionStatusLabel(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "paid") return "Da thanh toan";
  if (normalized === "partial") return "Thanh toan mot phan";
  if (normalized === "unpaid") return "Chua thanh toan";
  return status || "Chua cap nhat";
}

export function getTuitionStatusClassName(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "paid") return "bg-emerald-50 text-emerald-700";
  if (normalized === "partial") return "bg-amber-50 text-amber-700";
  if (normalized === "unpaid") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-700";
}

export function sortByLatestDate<T extends { id: number; created_at?: string }>(
  items: T[],
  ...dateFields: Array<keyof T>
) {
  return [...items].sort((a, b) => {
    const leftDate = dateFields.map((field) => String(b[field] || "")).find(Boolean) || String(b.created_at || "");
    const rightDate = dateFields.map((field) => String(a[field] || "")).find(Boolean) || String(a.created_at || "");
    return leftDate.localeCompare(rightDate) || Number(b.id) - Number(a.id);
  });
}
