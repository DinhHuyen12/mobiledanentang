"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, BadgeCheck, ReceiptText } from "lucide-react";
import { toast } from "sonner";

function VnpayResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentStatus =
    searchParams.get("payment_status") ||
    searchParams.get("paymentStatus") ||
    searchParams.get("status") ||
    searchParams.get("result");
  const message = searchParams.get("message") || "";
  const txnRef = searchParams.get("txn_ref") || "";
  const tuitionId = searchParams.get("tuition_id") || "";
  const responseCode = searchParams.get("vnp_ResponseCode") || "";

  const isSuccess = paymentStatus === "success" || paymentStatus === "paid";

  useEffect(() => {
    if (isSuccess) {
      toast.success(message || "Thanh toan VNPAY thanh cong");
    } else {
      toast.error(message || "Thanh toan VNPAY that bai");
    }
  }, [isSuccess, message]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/student/tuition" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} />
        Quay lai hoc phi
      </Link>

      <section
        className={`overflow-hidden rounded-[2rem] p-8 text-white shadow-xl ${
          isSuccess
            ? "bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_32%),linear-gradient(135deg,#0f9f63,#16c47f_55%,#8df0c1)]"
            : "bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_32%),linear-gradient(135deg,#b42318,#e5484d_55%,#ffb4b8)]"
        }`}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.28em] text-white/70">VNPay Result</p>
            <h1 className="mt-3 text-3xl font-bold">
              {isSuccess ? "Thanh toan thanh cong" : "Thanh toan khong thanh cong"}
            </h1>
            <p className="mt-3 text-sm text-white/85">
              {message || (isSuccess ? "He thong da ghi nhan giao dich hoc phi cua ban." : "Giao dich chua duoc hoan tat. Ban co the quay lai va thu lai.")}
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              {isSuccess ? <BadgeCheck size={22} /> : <AlertTriangle size={22} />}
              <span className="text-lg font-semibold">{isSuccess ? "Completed" : "Failed"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900">
            <ReceiptText size={18} />
            <h2 className="text-xl font-semibold">Chi tiet giao dich</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Ma giao dich</p>
              <p className="mt-2 break-all font-semibold text-slate-900">{txnRef || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Ma hoc phi</p>
              <p className="mt-2 font-semibold text-slate-900">{tuitionId || "-"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Trang thai</p>
              <p className={`mt-2 font-semibold ${isSuccess ? "text-emerald-700" : "text-rose-700"}`}>
                {isSuccess ? "Thanh cong" : "That bai"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Ma phan hoi</p>
              <p className="mt-2 font-semibold text-slate-900">{responseCode || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Tiep theo</h2>
          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() => router.push("/student/tuition")}
              className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Xem lai hoc phi
            </button>
            <button
              type="button"
              onClick={() => router.push("/student")}
              className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ve trang tong quan
            </button>
            {!isSuccess ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Neu ban vua thanh toan nhung trang thai chua cap nhat, hay thu tai lai sau vai giay hoac lien he admin de kiem tra.
              </p>
            ) : (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Giao dich da hoan tat. Danh sach hoc phi va lich su thanh toan se duoc cap nhat trong portal.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function StudentTuitionVnpayResultPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Dang tai ket qua thanh toan...</div>}>
      <VnpayResultContent />
    </Suspense>
  );
}
