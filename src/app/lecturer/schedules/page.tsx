"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, List, MapPin } from "lucide-react";
import { ScheduleItem, loadLecturerPortalData } from "@/lib/lecturer-portal";
import { useToastMessage } from "@/hooks/use-toast-message";
import {
  formatScheduleTime,
  getScheduleDayLabel,
  getScheduleDayOrder,
  normalizeScheduleDay,
} from "@/lib/schedules";

export default function LecturerSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  useToastMessage(error, "error");

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadLecturerPortalData();
      setSchedules(data.schedules);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được lịch dạy");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được lịch dạy");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const sortedSchedules = useMemo(() => {
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
      items: sortedSchedules.filter(
        (item) => normalizeScheduleDay(item.day_of_week) === dayKey
      ),
    }));
  }, [sortedSchedules]);

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải lịch dạy...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-sky-600 to-blue-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Lịch dạy</p>
        <h1 className="mt-3 text-3xl font-bold">Lịch dạy</h1>
        <p className="mt-2 text-sm text-white/80">
          Tổng hợp lịch dạy của các học phần đang phụ trách.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Chế độ xem lịch dạy</h2>
            <p className="text-sm text-slate-500">
              Xem nhanh theo danh sách hoặc dạng lịch tuần.
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

        {sortedSchedules.length > 0 ? (
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
                            {item.semester_name || "Chưa có học kỳ"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                        Không có buổi dạy
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            sortedSchedules.map((item) => (
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
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-slate-400" />
                    {`${formatScheduleTime(item.start_time)} - ${formatScheduleTime(item.end_time)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    {item.room || "Chưa có phòng học"}
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
            Chưa có lịch dạy nào.
          </div>
        )}
      </section>
    </div>
  );
}
