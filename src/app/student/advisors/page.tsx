"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Mail, UserRound } from "lucide-react";
import api from "@/lib/api";
import { getCollection } from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

type AdvisorItem = {
  id: number;
  lecturer_name?: string;
  lecturer_email?: string;
  class_name?: string;
  student_name?: string;
  start_date?: string;
  end_date?: string;
  note?: string;
  status?: string;
};

export default function StudentAdvisorsPage() {
  const [items, setItems] = useState<AdvisorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useToastMessage(error, "error");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/academic-advisors/me");
      setItems(getCollection(res.data) as AdvisorItem[]);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được cố vấn học tập");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được cố vấn học tập");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="text-sm text-slate-500">Đang tải cố vấn học tập...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-cyan-600 to-sky-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Academic Advisors</p>
        <h1 className="mt-3 text-3xl font-bold">Cố vấn học tập của tôi</h1>
        <p className="mt-2 text-sm text-white/80">
          Xem thông tin giảng viên cố vấn theo lớp hoặc cá nhân.
        </p>
      </section>

      <section className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{item.lecturer_name || "-"}</h2>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2"><UserRound size={16} /> Lớp: {item.class_name || "-"}</span>
                    <span className="inline-flex items-center gap-2"><Mail size={16} /> {item.lecturer_email || "-"}</span>
                    <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {item.start_date ? String(item.start_date).slice(0,10) : "-"} - {item.end_date ? String(item.end_date).slice(0,10) : "..."}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{item.note || "Không có ghi chú."}</p>
                </div>
                <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {item.status || "-"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
            Chưa có cố vấn học tập nào được phân công cho bạn.
          </div>
        )}
      </section>
    </div>
  );
}
