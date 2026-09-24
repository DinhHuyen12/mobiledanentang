"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, HandCoins, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { loadStudentPortalData } from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";
import {
  getApiCollection,
  type PaymentMethodOption,
  getTuitionStatusClassName,
  getTuitionStatusLabel,
  sortByLatestDate,
  type TuitionItem,
  type TuitionPaymentMethodsResponse,
  type TuitionPaymentItem,
  type TuitionPaymentsResponse,
} from "@/lib/tuition";

type PaymentItem = TuitionPaymentItem;

const getRemainingAmount = (tuition: TuitionItem) =>
  Math.max(Number(tuition.amount || 0) - Number(tuition.paid_amount || 0), 0);

export default function StudentTuitionPage() {
  const router = useRouter();
  const [tuitions, setTuitions] = useState<TuitionItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [selectedTuition, setSelectedTuition] = useState<TuitionItem | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodOption[]>(
    []
  );

  useToastMessage(error, "error");

  const fetchTuition = useCallback(async () => {
    try {
      setLoading(true);
      const [portalData, tuitionsRes] = await Promise.all([
        loadStudentPortalData(),
        api.get("/tuitions"),
      ]);

      const currentStudentId = portalData.studentInfo?.id;
      const tuitionList = (getApiCollection(tuitionsRes.data) as TuitionItem[]).filter(
        (item) => Number(item.student_id) === Number(currentStudentId)
      );
      const paymentResponses = await Promise.all(
        tuitionList.map(async (item) => {
          const response = await api.get(`/tuitions/${item.id}/payments`);
          return response.data as TuitionPaymentsResponse;
        })
      );
      const paymentList = paymentResponses.flatMap((item) => item.payments || []);

      setTuitions(tuitionList);
      setPayments(paymentList);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được học phí");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được học phí");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTuition();
  }, [fetchTuition]);

  const closePaymentModal = () => {
    setSelectedTuition(null);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentNote("");
    setAvailablePaymentMethods([]);
  };

  const openPaymentModal = async (tuition: TuitionItem) => {
    const remainingAmount = getRemainingAmount(tuition);

    try {
      const response = await api.get(`/tuitions/${tuition.id}/payment-methods`);
      const payload = response.data as TuitionPaymentMethodsResponse;
      const methods = payload.methods || [];

      setSelectedTuition({
        ...tuition,
        ...(payload.tuition || {}),
      });
      setAvailablePaymentMethods(methods);
      setPaymentAmount(remainingAmount > 0 ? String(remainingAmount) : "");
      setPaymentMethod(methods[0]?.code || "cash");
      setPaymentNote("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Khong tai duoc phuong thuc thanh toan");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Khong tai duoc phuong thuc thanh toan");
      }
    }
  };

  const validatePayment = () => {
    if (!selectedTuition) {
      return null;
    }

    const amount = Number(paymentAmount);
    const remainingAmount = getRemainingAmount(selectedTuition);

    if (!amount || amount <= 0) {
      toast.error("Vui lòng nhập số tiền thanh toán hợp lệ");
      return null;
    }

    if (amount > remainingAmount) {
      toast.error("Số tiền thanh toán vượt quá số tiền còn lại");
      return null;
    }

    return { amount };
  };

  const handlePayTuition = async () => {
    if (!selectedTuition || paying) return;

    const validated = validatePayment();
    if (!validated) return;

    try {
      setPaying(true);
      await api.post(`/tuitions/${selectedTuition.id}/pay`, {
        amount: validated.amount,
        payment_method: paymentMethod.trim() || "cash",
        note: paymentNote.trim(),
      });
      toast.success("Thanh toán học phí thành công");
      closePaymentModal();
      await fetchTuition();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Thanh toán học phí thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Thanh toán học phí thất bại");
      }
    } finally {
      setPaying(false);
    }
  };

  const handlePayWithVnpay = async () => {
    if (!selectedTuition) return;

    const validated = validatePayment();
    if (!validated) return;

    const query = new URLSearchParams({
      tuition_id: String(selectedTuition.id),
      amount: String(validated.amount),
      payment_method: paymentMethod.trim() || "vnpay",
      note: paymentNote.trim(),
    });

    closePaymentModal();
    router.push(`/student/tuition/vnpay?${query.toString()}`);
  };

  const totalAmount = useMemo(
    () => tuitions.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [tuitions]
  );
  const totalPaid = useMemo(
    () => tuitions.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0),
    [tuitions]
  );
  const overdueTuitions = useMemo(
    () =>
      tuitions.filter((item) => {
        const dueDate = item.due_date ? new Date(item.due_date) : null;
        return Boolean(dueDate && getRemainingAmount(item) > 0 && dueDate.getTime() < Date.now());
      }),
    [tuitions]
  );
  const sortedTuitions = useMemo(() => sortByLatestDate(tuitions, "due_date"), [tuitions]);
  const sortedPayments = useMemo(() => sortByLatestDate(payments, "payment_date"), [payments]);

  if (loading) return <div className="text-sm text-slate-500">Đang tải học phí...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Học phí</p>
        <h1 className="mt-3 text-3xl font-bold">Học phí và thanh toán</h1>
        <p className="mt-2 text-sm text-white/80">Theo dõi học phí theo học kỳ và lịch sử đóng tiền.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng học phí</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <HandCoins size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Đã thanh toán</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
              <TriangleAlert size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Khoản quá hạn</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{overdueTuitions.length}</p>
            </div>
          </div>
        </div>
      </section>

      {overdueTuitions.length > 0 ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-rose-700">Có học phí quá hạn cần xử lý</h2>
          <div className="mt-3 space-y-2 text-sm text-rose-700">
            {overdueTuitions.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/80 px-4 py-3">
                {item.semester_name || "Học kỳ"} • Hạn đóng {item.due_date ? String(item.due_date).slice(0, 10) : "-"} • Còn lại {getRemainingAmount(item).toLocaleString()}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Danh sách học phí</h2>
        <div className="mt-4 space-y-3">
          {sortedTuitions.length > 0 ? (
            sortedTuitions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.semester_name || "Chưa có học kỳ"}</p>
                    <p className="text-sm text-slate-500">
                      Tín chỉ: {item.total_credits ?? 0} • Hạn đóng: {item.due_date ? String(item.due_date).slice(0, 10) : "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTuitionStatusClassName(item.status)}`}>
                      {getTuitionStatusLabel(item.status)}
                    </span>
                    {getRemainingAmount(item) > 0 ? (
                      <button
                        type="button"
                        onClick={() => void openPaymentModal(item)}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Thanh toán
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  Tổng: {Number(item.amount ?? 0).toLocaleString()} • Đã đóng: {Number(item.paid_amount ?? 0).toLocaleString()} • Còn lại: {getRemainingAmount(item).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Chưa có dữ liệu học phí.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Lịch sử thanh toán</h2>
        <div className="mt-4 space-y-3">
          {sortedPayments.length > 0 ? (
            sortedPayments.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{Number(item.amount ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-slate-500">{item.semester_name || "Chưa có học kỳ"}</p>
                    <p className="text-sm text-slate-500">
                      {item.payment_date
                        ? String(item.payment_date).slice(0, 10)
                        : String(item.created_at || "").slice(0, 10) || "-"}{" "}
                      • {item.payment_method || "Chưa rõ phương thức"}
                    </p>
                    <p className="text-sm text-slate-500">{item.student_email || "Không có email sinh viên"}</p>
                  </div>
                  <span className="text-sm text-slate-500">{item.note || "Không có ghi chú"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Chưa có giao dịch thanh toán nào.
            </div>
          )}
        </div>
      </section>

      {selectedTuition ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Thanh toán học phí</h2>
                <p className="text-sm text-slate-500">
                  {selectedTuition.semester_name || "Học kỳ"} - Còn lại {getRemainingAmount(selectedTuition).toLocaleString()}
                </p>
              </div>
              <button type="button" onClick={closePaymentModal} className="rounded-xl p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Tổng học phí: {Number(selectedTuition.amount || 0).toLocaleString()} • Đã đóng: {Number(selectedTuition.paid_amount || 0).toLocaleString()}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Số tiền thanh toán</label>
                <input
                  type="number"
                  min={1}
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Nhập số tiền muốn thanh toán"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phương thức thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                >
                  {availablePaymentMethods.length > 0 ? (
                    availablePaymentMethods.map((method) => (
                      <option key={method.code || method.name} value={method.code || ""}>
                        {method.name || method.code || "Phuong thuc"}
                      </option>
                    ))
                  ) : (
                    <option value="cash">Tien mat</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                <input
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  placeholder="Nhập ghi chú thanh toán"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button type="button" onClick={closePaymentModal} className="rounded-xl border px-4 py-2">
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePayTuition}
                disabled={paying}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {paying ? "Đang xử lý..." : "Thanh toán thủ công"}
              </button>
              <button
                type="button"
                onClick={handlePayWithVnpay}
                disabled={paying}
                className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {paying ? "Đang xử lý..." : "Thanh toán qua VNPAY"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
