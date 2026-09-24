"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CreditCard, FileDown, HandCoins, ShieldAlert, WalletCards } from "lucide-react";
import api from "@/lib/api";
import { getCollection } from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

type AcademicWarningItem = {
  student_id?: number;
  student_name?: string;
  student_email?: string;
  class_name?: string;
  attempted_credits?: number;
  earned_credits?: number;
  failed_subjects?: number;
  cumulative_gpa?: number;
  warning_level?: string;
};

type TuitionDebtItem = {
  tuition_id?: number;
  student_name?: string;
  student_email?: string;
  class_name?: string;
  semester_name?: string;
  amount?: number;
  paid_amount?: number;
  remaining_amount?: number;
  status?: string;
  due_date?: string;
};

type LookupOption = {
  id: number;
  name?: string;
  class_name?: string;
  faculty_name?: string;
};

type FinancialSummary = {
  total_amount?: number;
  total_paid?: number;
  total_remaining?: number;
  payment_count?: number;
  student_count?: number;
  paid_invoices?: number;
  partial_invoices?: number;
  unpaid_invoices?: number;
};

type FinancialGroupItem = {
  semester_id?: number;
  semester_name?: string;
  academic_year_name?: string;
  name?: string;
  semester?: string;
  class_id?: number;
  class_name?: string;
  faculty_id?: number;
  faculty_name?: string;
  payment_method?: string;
  total_amount?: number;
  total_paid?: number;
  total_remaining?: number;
  total_due?: number;
  amount_due?: number;
  receivable?: number;
  paid_amount?: number;
  amount_paid?: number;
  collected_amount?: number;
  total_collected?: number;
  remaining_amount?: number;
  debt_amount?: number;
  total_debt?: number;
  unpaid_amount?: number;
  balance?: number;
  amount?: number;
  payment_count?: number;
  student_count?: number;
  invoice_count?: number;
  tuition_count?: number;
  total_invoices?: number;
};

type RecentPaymentItem = {
  id?: number;
  student_name?: string;
  student_email?: string;
  class_name?: string;
  semester_name?: string;
  payment_method?: string;
  amount?: number;
  payment_date?: string;
  created_at?: string;
  note?: string;
};

type FinancialReport = {
  summary?: FinancialSummary;
  by_semester?: FinancialGroupItem[];
  by_class?: FinancialGroupItem[];
  by_payment_method?: FinancialGroupItem[];
  recent_payments?: RecentPaymentItem[];
};

type FinancialFilters = {
  semester_id: string;
  class_id: string;
  faculty_id: string;
  date_from: string;
  date_to: string;
};

type PrintScope = "academic" | "debt" | "";

function formatMoney(value?: number) {
  return Number(value || 0).toLocaleString("vi-VN") + " VND";
}

function getNumberValue(item: FinancialGroupItem, keys: Array<keyof FinancialGroupItem>) {
  for (const key of keys) {
    const value = item[key];
    const numberValue = Number(value);
    if (value !== undefined && value !== null && Number.isFinite(numberValue)) {
      return numberValue;
    }
  }
  return 0;
}

function getGroupTotalAmount(item: FinancialGroupItem) {
  return getNumberValue(item, [
    "total_amount",
    "total_due",
    "amount_due",
    "receivable",
    "amount",
  ]);
}

function getGroupTotalPaid(item: FinancialGroupItem) {
  return getNumberValue(item, [
    "total_paid",
    "paid_amount",
    "amount_paid",
    "collected_amount",
    "total_collected",
  ]);
}

function getGroupTotalRemaining(item: FinancialGroupItem) {
  return getNumberValue(item, [
    "total_remaining",
    "remaining_amount",
    "debt_amount",
    "total_debt",
    "unpaid_amount",
    "balance",
  ]);
}

function getGroupInvoiceCount(item: FinancialGroupItem) {
  return getNumberValue(item, ["invoice_count", "tuition_count", "total_invoices"]);
}

function getGroupStudentCount(item: FinancialGroupItem) {
  return getNumberValue(item, ["student_count"]);
}

function getSemesterLabel(item: FinancialGroupItem) {
  const semesterName = item.semester_name || item.name || item.semester || `Hoc ky ${item.semester_id || "-"}`;
  return item.academic_year_name ? `${semesterName} - ${item.academic_year_name}` : semesterName;
}

function mergeFinancialGroups(
  items: FinancialGroupItem[],
  getKey: (item: FinancialGroupItem) => string
) {
  const grouped = new Map<string, FinancialGroupItem>();

  items.forEach((item) => {
    const key = getKey(item);
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        ...item,
        total_amount: getGroupTotalAmount(item),
        total_paid: getGroupTotalPaid(item),
        total_remaining: getGroupTotalRemaining(item),
        invoice_count: getGroupInvoiceCount(item),
        student_count: getGroupStudentCount(item),
      });
      return;
    }

    grouped.set(key, {
      ...current,
      ...item,
      total_amount: getGroupTotalAmount(current) + getGroupTotalAmount(item),
      total_paid: getGroupTotalPaid(current) + getGroupTotalPaid(item),
      total_remaining: getGroupTotalRemaining(current) + getGroupTotalRemaining(item),
      invoice_count: getGroupInvoiceCount(current) + getGroupInvoiceCount(item),
      student_count: Math.max(getGroupStudentCount(current), getGroupStudentCount(item)),
    });
  });

  return Array.from(grouped.values());
}

function getReportPayload<T>(payload: unknown, key: string, fallback: T): T {
  if (payload && typeof payload === "object") {
    if (key in payload) return (payload as Record<string, unknown>)[key] as T;
    if (
      "data" in payload &&
      (payload as { data?: unknown }).data &&
      typeof (payload as { data?: unknown }).data === "object"
    ) {
      const data = (payload as { data: Record<string, unknown> }).data;
      if (key in data) return data[key] as T;
    }
  }
  return fallback;
}

function buildFinancialParams(filters: FinancialFilters) {
  const params: Record<string, string> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  return params;
}

export default function AdminStatisticsPage() {
  const [warnings, setWarnings] = useState<AcademicWarningItem[]>([]);
  const [debts, setDebts] = useState<TuitionDebtItem[]>([]);
  const [financialReport, setFinancialReport] = useState<FinancialReport>({});
  const [semesters, setSemesters] = useState<LookupOption[]>([]);
  const [classes, setClasses] = useState<LookupOption[]>([]);
  const [faculties, setFaculties] = useState<LookupOption[]>([]);
  const [financialFilters, setFinancialFilters] = useState<FinancialFilters>({
    semester_id: "",
    class_id: "",
    faculty_id: "",
    date_from: "",
    date_to: "",
  });
  const [loading, setLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [error, setError] = useState("");
  const [printScope, setPrintScope] = useState<PrintScope>("");

  useToastMessage(error, "error");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [warningsRes, debtsRes] = await Promise.all([
        api.get("/reports/academic-warnings"),
        api.get("/reports/tuition-debts"),
      ]);
      setWarnings(getCollection(warningsRes.data) as AcademicWarningItem[]);
      setDebts(getCollection(debtsRes.data) as TuitionDebtItem[]);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc bao cao");
      } else {
        setError("Khong tai duoc bao cao");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [semestersRes, classesRes, facultiesRes] = await Promise.all([
        api.get("/semesters"),
        api.get("/classes"),
        api.get("/faculties"),
      ]);

      setSemesters(getCollection(semestersRes.data) as LookupOption[]);
      setClasses(getCollection(classesRes.data) as LookupOption[]);
      setFaculties(getCollection(facultiesRes.data) as LookupOption[]);
    } catch {
      setSemesters([]);
      setClasses([]);
      setFaculties([]);
    }
  }, []);

  const fetchFinancialReport = useCallback(async () => {
    try {
      setFinancialLoading(true);
      const response = await api.get("/reports/financial", {
        params: buildFinancialParams(financialFilters),
      });

      setFinancialReport({
        summary: getReportPayload<FinancialSummary | undefined>(
          response.data,
          "summary",
          undefined
        ),
        by_semester: getReportPayload<FinancialGroupItem[]>(response.data, "by_semester", []),
        by_class: getReportPayload<FinancialGroupItem[]>(response.data, "by_class", []),
        by_payment_method: getReportPayload<FinancialGroupItem[]>(
          response.data,
          "by_payment_method",
          []
        ),
        recent_payments: getReportPayload<RecentPaymentItem[]>(
          response.data,
          "recent_payments",
          []
        ),
      });
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc bao cao tai chinh");
      } else {
        setError("Khong tai duoc bao cao tai chinh");
      }
    } finally {
      setFinancialLoading(false);
    }
  }, [financialFilters]);

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, [fetchData, fetchLookups]);

  useEffect(() => {
    fetchFinancialReport();
  }, [fetchFinancialReport]);

  useEffect(() => {
    const handleAfterPrint = () => setPrintScope("");
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const exportPdf = (scope: Exclude<PrintScope, "">) => {
    setPrintScope(scope);
    window.setTimeout(() => window.print(), 100);
  };

  const totalDebt = useMemo(
    () => debts.reduce((sum, item) => sum + Number(item.remaining_amount || 0), 0),
    [debts]
  );
  const financialSummary = financialReport.summary || {};
  const bySemester = useMemo(
    () =>
      mergeFinancialGroups(financialReport.by_semester || [], (item) =>
        String(item.semester_id || getSemesterLabel(item))
      ),
    [financialReport.by_semester]
  );
  const byClass = useMemo(
    () =>
      mergeFinancialGroups(financialReport.by_class || [], (item) =>
        [item.class_id || item.class_name || "-", item.faculty_id || item.faculty_name || "-"].join("|")
      ),
    [financialReport.by_class]
  );
  const byPaymentMethod = financialReport.by_payment_method || [];
  const recentPayments = financialReport.recent_payments || [];

  return (
    <div className={`admin-report-page space-y-6 ${printScope ? `print-${printScope}` : ""}`}>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .admin-report-page.print-academic > :not([data-print-scope="academic"]),
          .admin-report-page.print-debt > :not([data-print-scope="debt"]) {
            display: none !important;
          }

          .print-hidden {
            display: none !important;
          }

          [data-print-scope] {
            break-inside: avoid;
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
          }

          table {
            break-inside: auto;
          }

          tr {
            break-inside: avoid;
            break-after: auto;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <section className="print-hidden rounded-[2rem] bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Reports</p>
        <h1 className="mt-3 text-3xl font-bold">Bao cao canh bao va cong no</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/80">
          Theo doi sinh vien canh bao hoc vu va cac khoan hoc phi con no.
        </p>
      </section>

      <section className="print-hidden grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Canh bao hoc vu</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{warnings.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Cong no hoc phi</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{debts.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Tong no con lai</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatMoney(totalDebt)}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Muc do uu tien</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {warnings.length + debts.length > 0 ? "Can theo doi" : "On dinh"}
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section data-print-scope="financial" className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <WalletCards size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Bao cao tai chinh</h2>
              <p className="text-sm text-slate-500">
                Tong hop hoc phi, thanh toan va cong no theo hoc ky, lop, khoa.
              </p>
            </div>
          </div>
          <div className="print-hidden flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportPdf("debt")}
              disabled={financialLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileDown size={16} />
              Xuat DS cong no
            </button>
            <button
              type="button"
              onClick={() => void fetchFinancialReport()}
              disabled={financialLoading}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {financialLoading ? "Dang tai..." : "Tai lai bao cao"}
            </button>
          </div>
        </div>

        <div className="print-hidden grid gap-3 md:grid-cols-5">
          <select
            value={financialFilters.semester_id}
            onChange={(event) =>
              setFinancialFilters((prev) => ({ ...prev, semester_id: event.target.value }))
            }
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Tat ca hoc ky</option>
            {semesters.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || `Hoc ky ${item.id}`}
              </option>
            ))}
          </select>

          <select
            value={financialFilters.class_id}
            onChange={(event) =>
              setFinancialFilters((prev) => ({ ...prev, class_id: event.target.value }))
            }
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Tat ca lop</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || item.class_name || `Lop ${item.id}`}
              </option>
            ))}
          </select>

          <select
            value={financialFilters.faculty_id}
            onChange={(event) =>
              setFinancialFilters((prev) => ({ ...prev, faculty_id: event.target.value }))
            }
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
          >
            <option value="">Tat ca khoa</option>
            {faculties.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || item.faculty_name || `Khoa ${item.id}`}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={financialFilters.date_from}
            onChange={(event) =>
              setFinancialFilters((prev) => ({ ...prev, date_from: event.target.value }))
            }
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
          />

          <input
            type="date"
            value={financialFilters.date_to}
            onChange={(event) =>
              setFinancialFilters((prev) => ({ ...prev, date_to: event.target.value }))
            }
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400"
          />
        </div>
      </section>

      <section data-print-scope="financial" className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Tong phai thu</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatMoney(financialSummary.total_amount)}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Da thu</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatMoney(financialSummary.total_paid)}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Con no</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">
            {formatMoney(financialSummary.total_remaining)}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Luot thanh toan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {financialSummary.payment_count ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Sinh vien</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {financialSummary.student_count ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Hoa don da thanh toan</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {financialSummary.paid_invoices ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Hoa don dang thanh toan</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {financialSummary.partial_invoices ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Hoa don chua thanh toan</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">
            {financialSummary.unpaid_invoices ?? 0}
          </p>
        </div>
      </section>

      <section data-print-scope="financial" className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
              <BarChart3 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Thong ke theo hoc ky</h2>
              <p className="text-sm text-slate-500">So sanh phai thu, da thu va con no.</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Hoc ky</th>
                  <th className="px-6 py-4">Phai thu</th>
                  <th className="px-6 py-4">Da thu</th>
                  <th className="px-6 py-4">Con no</th>
                  <th className="px-6 py-4">Hoa don</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {financialLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      Dang tai bao cao tai chinh...
                    </td>
                  </tr>
                ) : bySemester.length > 0 ? (
                  bySemester.map((item, index) => (
                    <tr key={`${item.semester_id || getSemesterLabel(item)}-${index}`}>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {getSemesterLabel(item)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatMoney(getGroupTotalAmount(item))}</td>
                      <td className="px-6 py-4 text-sm text-emerald-700">{formatMoney(getGroupTotalPaid(item))}</td>
                      <td className="px-6 py-4 text-sm text-rose-700">{formatMoney(getGroupTotalRemaining(item))}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{getGroupInvoiceCount(item)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                      Khong co du lieu theo hoc ky.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <HandCoins size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Phuong thuc thanh toan</h2>
              <p className="text-sm text-slate-500">Tien thu theo tung phuong thuc.</p>
            </div>
          </div>
          <div className="space-y-3">
            {byPaymentMethod.length > 0 ? (
              byPaymentMethod.map((item, index) => (
                <div key={`${item.payment_method || "method"}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.payment_method || "Khac"}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                      {item.payment_count ?? 0} luot
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatMoney(item.total_paid ?? item.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chua co thanh toan theo filter hien tai.
              </div>
            )}
          </div>
        </div>
      </section>

      <section data-print-scope="financial" className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Thong ke theo lop/khoa</h2>
          <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Lop/Khoa</th>
                  <th className="px-6 py-4">Da thu</th>
                  <th className="px-6 py-4">Con no</th>
                  <th className="px-6 py-4">SV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {byClass.length > 0 ? (
                  byClass.map((item, index) => (
                    <tr key={`${item.class_id || item.faculty_id || "class"}-${index}`}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{item.class_name || "-"}</p>
                        <p className="text-sm text-slate-500">{item.faculty_name || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-emerald-700">{formatMoney(getGroupTotalPaid(item))}</td>
                      <td className="px-6 py-4 text-sm text-rose-700">{formatMoney(getGroupTotalRemaining(item))}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{getGroupStudentCount(item)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                      Khong co du lieu theo lop/khoa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">20 giao dich gan nhat</h2>
          <div className="mt-4 space-y-3">
            {recentPayments.length > 0 ? (
              recentPayments.map((item, index) => (
                <div key={`${item.id || "payment"}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.student_name || "-"}</p>
                      <p className="text-sm text-slate-500">
                        {item.class_name || "-"} | {item.semester_name || "-"}
                      </p>
                      <p className="text-sm text-slate-500">{item.student_email || "-"}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-semibold text-emerald-700">{formatMoney(item.amount)}</p>
                      <p className="text-sm text-slate-500">{item.payment_method || "-"}</p>
                      <p className="text-xs text-slate-400">
                        {String(item.payment_date || item.created_at || "").slice(0, 10) || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chua co giao dich thanh toan.
              </div>
            )}
          </div>
        </div>
      </section>

      <section data-print-scope="academic" className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Bao cao hoc tap</h2>
              <p className="text-sm text-slate-500">
                Danh sach sinh vien co GPA thap hoac nhieu mon chua dat.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportPdf("academic")}
            disabled={loading}
            className="print-hidden inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileDown size={16} />
            Xuat PDF
          </button>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Sinh vien</th>
                <th className="px-6 py-4">Lop</th>
                <th className="px-6 py-4">Tin chi</th>
                <th className="px-6 py-4">GPA</th>
                <th className="px-6 py-4">Canh bao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Dang tai du lieu...
                  </td>
                </tr>
              ) : warnings.length > 0 ? (
                warnings.map((item, index) => (
                  <tr key={`${item.student_id || "warning"}-${index}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{item.student_name || "-"}</p>
                      <p className="text-sm text-slate-500">{item.student_email || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.class_name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      Hoc: {item.attempted_credits ?? 0} | Dat: {item.earned_credits ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      GPA {item.cumulative_gpa ?? 0} | Rot {item.failed_subjects ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {item.warning_level || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Khong co sinh vien nao dang bi canh bao hoc vu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section data-print-scope="debt" className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Bao cao cong no hoc phi</h2>
            <p className="text-sm text-slate-500">
              Danh sach cac khoan hoc phi chua thanh toan day du.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Sinh vien</th>
                <th className="px-6 py-4">Hoc ky</th>
                <th className="px-6 py-4">Hoc phi</th>
                <th className="px-6 py-4">Han dong</th>
                <th className="px-6 py-4">Trang thai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Dang tai du lieu...
                  </td>
                </tr>
              ) : debts.length > 0 ? (
                debts.map((item, index) => (
                  <tr key={`${item.tuition_id || "debt"}-${index}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{item.student_name || "-"}</p>
                      <p className="text-sm text-slate-500">
                        {item.class_name || "-"} | {item.student_email || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.semester_name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      Tong: {formatMoney(item.amount)} | Da dong: {formatMoney(item.paid_amount)}
                      <div>Con lai: {formatMoney(item.remaining_amount)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.due_date ? String(item.due_date).slice(0, 10) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                        {item.status || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Khong co khoan no hoc phi nao.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
