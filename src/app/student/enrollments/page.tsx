"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, MapPin, Search, Trash2, UserRound } from "lucide-react";
import api from "@/lib/api";
import {
  EnrollmentItem,
  getEnrollmentTypeClassName,
  getEnrollmentTypeLabel,
  isCancelledEnrollmentStatus,
  isStudentRegistrationType,
  loadStudentPortalData,
} from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";
import ConfirmDialog from "@/components/app/confirm-dialog";

export default function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useToastMessage(error, "error");
  useToastMessage(message, "success");

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadStudentPortalData();
      setEnrollments(data.enrollments.filter((item) => isStudentRegistrationType(item)));
      setError("");
      setMessage("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc hoc phan");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tai duoc hoc phan");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const filteredEnrollments = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();

    return enrollments.filter((item) => {
      const subject = item.subject_name?.toLowerCase() || "";
      const semester = item.semester_name?.toLowerCase() || "";
      const status = item.status?.toLowerCase() || "";

      return (
        subject.includes(lowerKeyword) ||
        semester.includes(lowerKeyword) ||
        status.includes(lowerKeyword)
      );
    });
  }, [enrollments, keyword]);

  const closeCancelDialog = () => {
    setSelectedEnrollment(null);
  };

  const getEnrollmentStatusLabel = (status?: string) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "pending") return "Cho duyet";
    if (normalized === "rejected") return "Bi tu choi";
    if (normalized === "active" || normalized === "dang hoc") return "Da duyet";
    if (normalized === "completed") return "Da hoan thanh";
    if (normalized === "cancelled" || normalized === "canceled") return "Da huy";
    if (normalized === "dropped") return "Da rut";
    return "";
  };

  const handleCancelEnrollment = async () => {
    if (!selectedEnrollment || cancelling) return;

    try {
      setCancelling(true);
      await api.put(`/enrollments/${selectedEnrollment.id}`, {
        course_section_id: Number(selectedEnrollment.course_section_id),
        status: "cancelled",
      });
      setMessage("Hủy đăng ký học phần thành công");
      closeCancelDialog();
      await fetchEnrollments();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Hủy đăng ký học phần thất bại");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Hủy đăng ký học phần thất bại");
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải học phần...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Học phần của tôi</p>
        <h1 className="mt-3 text-3xl font-bold">Học phần của tôi</h1>
        <p className="mt-2 text-sm text-white/80">
          Theo dõi các học phần đã đăng ký và trạng thái hiện tại.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo môn học, học kỳ, trạng thái..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div className="text-sm text-slate-500">
            Tổng học phần:{" "}
            <span className="font-semibold text-slate-700">{filteredEnrollments.length}</span>
          </div>
        </div>

        <div className="space-y-3">
          {filteredEnrollments.length > 0 ? (
            filteredEnrollments.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.subject_name || `Học phần ${item.course_section_id}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.semester_name || "Ch?a c? h?c k?"}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getEnrollmentTypeClassName(item)}`}
                      >
                        {getEnrollmentTypeLabel(item)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      {item.lecturer_name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={14} className="text-slate-400" />
                          {item.lecturer_name}
                        </span>
                      ) : null}
                      {item.room ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} className="text-slate-400" />
                          {item.room}
                        </span>
                      ) : null}
                      {item.schedule ? (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-slate-400" />
                          {item.schedule}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getEnrollmentStatusLabel(item.status) ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {getEnrollmentStatusLabel(item.status)}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    {item.status || "-"}
                  </span>
                  {!isCancelledEnrollmentStatus(item.status) ? (
                    <button
                      type="button"
                      onClick={() => setSelectedEnrollment(item)}
                      className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
                    >
                      <Trash2 size={14} />
                      Hủy đăng ký
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Không có học phần phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(selectedEnrollment)}
        title="Hủy đăng ký học phần"
        description={
          selectedEnrollment
            ? `Bạn có chắc muốn hủy đăng ký học phần ${
                selectedEnrollment.subject_name || `#${selectedEnrollment.course_section_id}`
              } không?`
            : ""
        }
        confirmLabel="Hủy đăng ký"
        cancelLabel="Đóng"
        tone="danger"
        loading={cancelling}
        onCancel={closeCancelDialog}
        onConfirm={handleCancelEnrollment}
      />
    </div>
  );
}
