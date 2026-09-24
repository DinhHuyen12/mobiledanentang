"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, List, MapPin, UserRound } from "lucide-react";
import api from "@/lib/api";
import {
  getCollection,
  isActiveEnrollmentStatus,
  loadStudentPortalData,
} from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";
import {
  BackendScheduleItem,
  formatScheduleTime,
  getScheduleDayLabel,
  getScheduleDayOrder,
  normalizeScheduleDay,
} from "@/lib/schedules";

export default function StudentSchedulePage() {
  const [schedules, setSchedules] = useState<BackendScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  useToastMessage(error, "error");

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const [portalData, schedulesRes] = await Promise.all([
        loadStudentPortalData(),
        api.get("/schedules"),
      ]);

      const sectionIds = new Set(
        portalData.enrollments
          .filter((item) => isActiveEnrollmentStatus(item.status))
          .map((item) => Number(item.course_section_id))
      );
      const scheduleList = getCollection(schedulesRes.data) as BackendScheduleItem[];

      setSchedules(
        scheduleList.filter((item) => sectionIds.has(Number(item.course_section_id)))
      );
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được lịch học");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được lịch học");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const groupedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      return (
        getScheduleDayOrder(a.day_of_week) - getScheduleDayOrder(b.day_of_week) ||
        String(a.start_time || "").localeCompare(String(b.start_time || "")) ||
        String(a.subject_name || "").localeCompare(String(b.subject_name || ""))
      );
    });
  }, [schedules]);

  const calendarColumns = useMemo(() => {
    const dayKeys = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    return dayKeys.map((dayKey) => ({
      dayKey,
      label: getScheduleDayLabel(dayKey),
      items: groupedSchedules.filter(
        (item) => normalizeScheduleDay(item.day_of_week) === dayKey
      ),
    }));
  }, [groupedSchedules]);

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải lịch học...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-sky-600 to-cyan-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Lịch học</p>
        <h1 className="mt-3 text-3xl font-bold">Lịch học của tôi</h1>
        <p className="mt-2 text-sm text-white/80">
          Tổng hợp lịch học theo các học phần đã đăng ký.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chế độ xem lịch học</h2>
            <p className="text-sm text-slate-500">
              Chuyển nhanh giữa dạng danh sách và dạng lịch theo tuần.
            </p>
          </div>
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                viewMode === "calendar"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays size={16} />
              Dạng lịch
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                viewMode === "list"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List size={16} />
              Dạng danh sách
            </button>
          </div>
        </div>

        {groupedSchedules.length > 0 ? (
          viewMode === "calendar" ? (
            <div className="grid gap-4 lg:grid-cols-7">
              {calendarColumns.map((column) => (
                <div key={column.dayKey} className="rounded-3xl bg-white p-4 shadow-sm">
                  <div className="rounded-2xl bg-sky-50 px-3 py-3 text-center">
                    <p className="text-sm font-semibold text-sky-700">{column.label}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {column.items.length > 0 ? (
                      column.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {item.subject_name || `Học phần ${item.course_section_id}`}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {formatScheduleTime(item.start_time)} -{" "}
                            {formatScheduleTime(item.end_time)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.room || "Chưa có phòng học"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.lecturer_name || "Chưa có giảng viên"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                        Không có buổi học
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            groupedSchedules.map((item) => (
              <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {item.subject_name || `Học phần ${item.course_section_id}`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.semester_name || "Chưa có học kỳ"}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    {getScheduleDayLabel(item.day_of_week)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-slate-400" />
                    {`${formatScheduleTime(item.start_time)} - ${formatScheduleTime(item.end_time)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    {item.room || "Chưa có phòng học"}
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRound size={16} className="text-slate-400" />
                    {item.lecturer_name || "Chưa có giảng viên"}
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
            Chưa có lịch học nào từ các học phần đã đăng ký.
          </div>
        )}
      </section>
    </div>
  );
}
