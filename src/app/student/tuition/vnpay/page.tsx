"use client";

import axios from "axios";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Building2, CreditCard, LoaderCircle, ShieldCheck, Wallet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { type TuitionItem } from "@/lib/tuition";

type PaymentMethodsResponse = {
  tuition?: {
    id?: number;
    amount?: number;
    paid_amount?: number;
    remaining_amount?: number;
    status?: string;
  };
  methods?: Array<{
    code?: string;
    name?: string;
    description?: string;
  }>;
};

function VnpayCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tuitionId = Number(searchParams.get("tuition_id") || 0);
  const requestedAmount = Number(searchParams.get("amount") || 0);
  const requestedMethod = searchParams.get("payment_method") || "vnpay";
  const requestedNote = searchParams.get("note") || "";

  const [tuition, setTuition] = useState<TuitionItem | null>(null);
  const [availableMethods, setAvailableMethods] = useState<PaymentMethodsResponse["methods"]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tuitionId || requestedAmount <= 0) {
      setError("Thong tin thanh toan khong hop le");
      setLoading(false);
      return;
    }

    const loadCheckoutData = async () => {
      try {
        setLoading(true);
        const [tuitionRes, methodsRes] = await Promise.all([
          api.get(`/tuitions/${tuitionId}`),
          api.get(`/tuitions/${tuitionId}/payment-methods`),
        ]);

        setTuition(tuitionRes.data as TuitionItem);
        const methodsPayload = methodsRes.data as PaymentMethodsResponse;
        setAvailableMethods(methodsPayload.methods || []);
        setError("");
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Khong tai duoc thong tin thanh toan");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Khong tai duoc thong tin thanh toan");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadCheckoutData();
  }, [requestedAmount, tuitionId]);

  const remainingAmount = useMemo(() => {
    if (!tuition) {
      return 0;
    }

    const fallbackRemaining = Number(tuition.amount || 0) - Number(tuition.paid_amount || 0);
    return Math.max(Number((tuition as TuitionItem & { remaining_amount?: number }).remaining_amount ?? fallbackRemaining), 0);
  }, [tuition]);

  const selectedMethod = useMemo(
    () => availableMethods?.find((method) => method.code === "vnpay") || availableMethods?.find((method) => method.code === requestedMethod),
    [availableMethods, requestedMethod]
  );

  const handleProceedPayment = async () => {
    if (!tuition || submitting) {
      return;
    }

    if (requestedAmount <= 0) {
      toast.error("So tien thanh toan khong hop le");
      return;
    }

    if (requestedAmount > remainingAmount) {
      toast.error("So tien thanh toan vuot qua so tien con lai");
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/tuitions/${tuition.id}/pay/vnpay`, {
        amount: requestedAmount,
        payment_method: requestedMethod || "vnpay",
        note: requestedNote,
      });

      const payload = response.data as
        | {
            paymentUrl?: string;
            payment_url?: string;
            url?: string;
            data?: {
              paymentUrl?: string;
              payment_url?: string;
              url?: string;
            };
          }
        | undefined;

      const paymentUrl =
        payload?.paymentUrl ||
        payload?.payment_url ||
        payload?.url ||
        payload?.data?.paymentUrl ||
        payload?.data?.payment_url ||
        payload?.data?.url;

      if (!paymentUrl) {
        toast.error("Khong lay duoc lien ket thanh toan VNPAY");
        return;
      }

      window.location.href = paymentUrl;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Tao lien ket VNPAY that bai");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Tao lien ket VNPAY that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-slate-600 shadow-sm">
          <LoaderCircle className="animate-spin" size={18} />
          Dang tai trang thanh toan VNPAY...
        </div>
      </div>
    );
  }

  if (error || !tuition) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/student/tuition" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} />
          Quay lai hoc phi
        </Link>
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {error || "Khong tim thay thong tin hoc phi"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/student/tuition" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} />
        Quay lai hoc phi
      </Link>

      <section className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_35%),linear-gradient(135deg,#005baa,#0a8fda_55%,#7fd8ff)] p-8 text-white shadow-xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">VNPay Checkout</p>
            <h1 className="mt-3 text-3xl font-bold">Xac nhan thanh toan hoc phi</h1>
            <p className="mt-3 text-sm text-white/85">
              Ban se duoc chuyen sang cong thanh toan VNPAY sau khi xac nhan. Thong tin thanh toan se duoc giu nguyen trong suot qua trinh giao dich.
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">So tien thanh toan</p>
            <p className="mt-2 text-3xl font-bold">{requestedAmount.toLocaleString()} VND</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Thong tin giao dich</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3 text-slate-800">
                <CreditCard size={18} />
                <span className="font-semibold">Hoc phi</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">Hoc ky: {tuition.semester_name || "Chua co hoc ky"}</p>
              <p className="mt-1 text-sm text-slate-600">So tin chi: {Number(tuition.total_credits || 0)}</p>
              <p className="mt-1 text-sm text-slate-600">Han dong: {tuition.due_date ? String(tuition.due_date).slice(0, 10) : "-"}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3 text-slate-800">
                <Wallet size={18} />
                <span className="font-semibold">Chi tiet so tien</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">Tong hoc phi: {Number(tuition.amount || 0).toLocaleString()} VND</p>
              <p className="mt-1 text-sm text-slate-600">Da thanh toan: {Number(tuition.paid_amount || 0).toLocaleString()} VND</p>
              <p className="mt-1 text-sm font-semibold text-sky-700">Con lai: {remainingAmount.toLocaleString()} VND</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 text-slate-800">
              <Building2 size={18} />
              <span className="font-semibold">Cong thanh toan duoc chon</span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl bg-sky-50 p-4">
              <div>
                <p className="font-semibold text-slate-900">{selectedMethod?.name || "VNPay"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedMethod?.description || "Thanh toan online qua cong VNPay."}
                </p>
                <p className="mt-3 text-sm text-slate-500">Phuong thuc gui len server: {requestedMethod}</p>
                <p className="mt-1 text-sm text-slate-500">Ghi chu: {requestedNote || "Khong co ghi chu"}</p>
              </div>
              <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                San sang
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Xac nhan thanh toan</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">So tien se thanh toan</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{requestedAmount.toLocaleString()} VND</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                Sau khi bam xac nhan, he thong se chuyen ban sang giao dien VNPAY de hoan tat giao dich.
              </div>
              <button
                type="button"
                onClick={handleProceedPayment}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
              >
                {submitting ? <LoaderCircle className="animate-spin" size={16} /> : <BadgeCheck size={16} />}
                {submitting ? "Dang tao giao dich..." : "Tiep tuc den cong VNPAY"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/student/tuition")}
                className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Huy thanh toan
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-slate-900">
              <ShieldCheck size={18} />
              <h2 className="text-lg font-semibold">Luu y</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Khong dong tab trong luc dang duoc chuyen sang cong thanh toan.</p>
              <p>Sau khi thanh toan xong, he thong se tu quay lai trang hoc phi de cap nhat ket qua.</p>
              <p>Neu giao dich that bai, ban co the thu lai tu danh sach hoc phi.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function StudentTuitionVnpayPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Dang tai trang thanh toan VNPAY...</div>}>
      <VnpayCheckoutContent />
    </Suspense>
  );
}
