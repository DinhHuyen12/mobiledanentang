"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, GraduationCap, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useToastMessage } from "@/hooks/use-toast-message";

type EvaluationResponse = {
  student_program?: {
    student_name?: string;
    program_name?: string;
    program_code?: string;
    expected_graduation_date?: string;
    status?: string;
  };
  summary?: {
    cumulative_gpa?: number;
    earned_credits?: number;
    total_failed_subjects?: number;
    total_missing_required_subjects?: number;
  };
  graduation_requirements?: {
    min_cumulative_gpa?: number;
    min_earned_credits?: number;
    max_failed_subjects?: number;
    required_english_level?: string;
    required_it_level?: string;
  };
  eligibility_checks?: Array<{
    label?: string;
    met?: boolean;
    actual?: string | number | null;
    required?: string | number | null;
  }>;
  missing_required_subject_list?: Array<{
    subject_code?: string;
    subject_name?: string;
  }>;
  is_eligible_for_graduation?: boolean;
};

export default function StudentGraduationPage() {
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");

  useToastMessage(error, "error");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/graduation-requirements/evaluate/me");
      setData(res.data as EvaluationResponse);
      setError("");
      setEmptyMessage("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || "Khong tai duoc du lieu tot nghiep";
        if (err.response?.status === 404 || message.toLowerCase().includes("khong tim thay")) {
          setData(null);
          setEmptyMessage("Chua co thong tin danh gia tot nghiep cho sinh vien nay.");
          setError("");
        } else {
          setError(message);
          setEmptyMessage("");
        }
      } else {
        setError("Khong tai duoc du lieu tot nghiep");
        setEmptyMessage("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="text-sm text-slate-500">Dang tai danh gia tot nghiep...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!data || emptyMessage) {
    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-cyan-600 p-6 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">Graduation</p>
          <h1 className="mt-3 text-3xl font-bold">Tien do tot nghiep</h1>
          <p className="mt-2 text-sm text-white/80">
            Theo doi muc do hoan thanh dieu kien tot nghiep cua ban.
          </p>
        </section>

        <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Chua co du lieu danh gia tot nghiep
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            {emptyMessage || "Sinh vien nay chua duoc danh gia hoac chua duoc gan dieu kien tot nghiep."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-cyan-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Graduation</p>
        <h1 className="mt-3 text-3xl font-bold">Tien do tot nghiep</h1>
        <p className="mt-2 text-sm text-white/80">
          Theo doi muc do hoan thanh dieu kien tot nghiep cua ban.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Trang thai</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data.is_eligible_for_graduation ? "Dat" : "Chua dat"}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">GPA tich luy</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data.summary?.cumulative_gpa ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Tin chi dat</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data.summary?.earned_credits ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Mon bat buoc con thieu</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data.summary?.total_missing_required_subjects ?? 0}
          </p>
        </div>
      </section>

      <section
        className={`rounded-3xl border p-5 ${
          data.is_eligible_for_graduation
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-2xl p-3 ${
              data.is_eligible_for_graduation
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {data.is_eligible_for_graduation ? (
              <ShieldCheck size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {data.is_eligible_for_graduation
                ? "Ban da dat dieu kien tot nghiep"
                : "Ban chua dat day du dieu kien tot nghiep"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {data.student_program?.program_name || "-"}{" "}
              {data.student_program?.program_code ? `(${data.student_program.program_code})` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <GraduationCap size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Tong quan</h2>
              <p className="text-sm text-slate-500">Chi tiet chuong trinh va cac chi so hien tai.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Chuong trinh</p>
              <p className="mt-2 font-semibold text-slate-900">
                {data.student_program?.program_name || "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Du kien tot nghiep</p>
              <p className="mt-2 font-semibold text-slate-900">
                {data.student_program?.expected_graduation_date
                  ? String(data.student_program.expected_graduation_date).slice(0, 10)
                  : "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Mon rot</p>
              <p className="mt-2 font-semibold text-slate-900">
                {data.summary?.total_failed_subjects ?? 0}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Trang thai phan bo</p>
              <p className="mt-2 font-semibold text-slate-900">
                {data.student_program?.status || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Dieu kien can dat</h2>
              <p className="text-sm text-slate-500">Nguong tot nghiep cua chuong trinh.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              GPA toi thieu: {data.graduation_requirements?.min_cumulative_gpa ?? 0}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Tin chi toi thieu: {data.graduation_requirements?.min_earned_credits ?? 0}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Mon rot toi da: {data.graduation_requirements?.max_failed_subjects ?? 0}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Ngoai ngu: {data.graduation_requirements?.required_english_level || "Khong yeu cau"}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              Tin hoc: {data.graduation_requirements?.required_it_level || "Khong yeu cau"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Kiem tra tung dieu kien</h2>
        <div className="mt-4 space-y-3">
          {(data.eligibility_checks || []).length > 0 ? (
            data.eligibility_checks?.map((item, index) => (
              <div
                key={`${item.label || "check"}-${index}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.label || "Dieu kien"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Hien tai: {item.actual ?? "-"} | Yeu cau: {item.required ?? "-"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.met ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {item.met ? "Dat" : "Chua dat"}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Chua co danh gia chi tiet.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Mon hoc con thieu</h2>
        {(data.missing_required_subject_list || []).length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.missing_required_subject_list?.map((item, index) => (
              <span
                key={`${item.subject_code || "subject"}-${index}`}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              >
                {(item.subject_code || "-") + " - " + (item.subject_name || "-")}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Ban khong con mon bat buoc nao bi thieu.
          </div>
        )}
      </section>
    </div>
  );
}
