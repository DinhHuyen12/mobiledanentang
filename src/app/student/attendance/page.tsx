"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Clock3,
  Download,
  MapPin,
  Search,
  UserCheck2,
} from "lucide-react";
import api from "@/lib/api";
import {
  AttendanceRecordItem,
  AttendanceSessionItem,
  AttendanceSessionRecordsResponse,
  getAttendanceStatusClassName,
  getAttendanceStatusLabel,
} from "@/lib/attendance";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

function getCollection(payload: unknown) {
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

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");

  useToastMessage(error, "error");

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/attendance-sessions");
      const nextSessions = getCollection(response.data) as AttendanceSessionItem[];

      setSessions(nextSessions);
      setSelectedSessionId((current) => {
        if (current && nextSessions.some((item) => Number(item.id) === Number(current))) {
          return current;
        }
        return nextSessions[0]?.id ?? null;
      });
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc buoi diem danh");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tai duoc buoi diem danh");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async (sessionId: number | null) => {
    if (!sessionId) {
      setRecords([]);
      return;
    }

    try {
      setRecordsLoading(true);
      const response = await api.get(`/attendance-sessions/${sessionId}/records`);
      const payload = response.data as AttendanceSessionRecordsResponse;
      setRecords(payload.records || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc chi tiet diem danh");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tai duoc chi tiet diem danh");
      }
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    void fetchRecords(selectedSessionId);
  }, [fetchRecords, selectedSessionId]);

  const handleExportAttendance = async () => {
    if (!selectedSessionId || exporting) return;

    try {
      setExporting(true);
      const response = await api.get(`/attendance-sessions/${selectedSessionId}/export`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = String(response.headers["content-disposition"] || "");
      const match = disposition.match(/filename="?(.*?)"?$/i);

      link.href = url;
      link.download = match?.[1] || `diem-danh-session-${selectedSessionId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Đã export danh sách điểm danh");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Export điểm danh thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Export điểm danh thất bại");
      }
    } finally {
      setExporting(false);
    }
  };

  const selectedSession = useMemo(
    () => sessions.find((item) => Number(item.id) === Number(selectedSessionId)) || null,
    [selectedSessionId, sessions]
  );

  const filteredRecords = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return records.filter((item) => {
      const studentName = String(item.student_name || "").toLowerCase();
      const studentEmail = String(item.student_email || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();

      return (
        studentName.includes(lowerKeyword) ||
        studentEmail.includes(lowerKeyword) ||
        status.includes(lowerKeyword)
      );
    });
  }, [keyword, records]);

  const summary = useMemo(
    () => ({
      present: records.filter((item) => item.status === "present").length,
      late: records.filter((item) => item.status === "late").length,
      absent: records.filter((item) => item.status === "absent").length,
      excused: records.filter((item) => item.status === "excused").length,
    }),
    [records]
  );

  if (loading) {
    return <div className="text-sm text-slate-500">Dang tai diem danh...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Attendance</p>
        <h1 className="mt-3 text-3xl font-bold">Diem danh cua toi</h1>
        <p className="mt-2 text-sm text-white/80">
          Theo doi tinh trang co mat, di muon va vang mat theo tung buoi hoc.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Tong buoi hoc</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{sessions.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Co mat</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.present}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Di muon</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{summary.late}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Vang mat</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">{summary.absent}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarCheck2 className="text-emerald-600" size={18} />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Danh sach buoi hoc</h2>
              <p className="text-sm text-slate-500">Chon mot buoi hoc de xem ket qua diem danh.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {sessions.length > 0 ? (
              sessions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSessionId(Number(item.id))}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    Number(item.id) === Number(selectedSessionId)
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">
                      {item.topic || item.subject_name || `Buoi hoc #${item.id}`}
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {String(item.session_date || "").slice(0, 10) || "-"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} />
                      {String(item.start_time || "").slice(0, 5) || "--:--"} -{" "}
                      {String(item.end_time || "").slice(0, 5) || "--:--"}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {item.room || "Chua co phong"}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chua co du lieu diem danh nao.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <UserCheck2 className="text-emerald-600" size={18} />
                <h2 className="text-xl font-semibold text-slate-900">Chi tiet diem danh</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {selectedSession
                  ? selectedSession.topic || selectedSession.subject_name || `Buoi hoc #${selectedSession.id}`
                  : "Chon mot buoi hoc de xem chi tiet"}
              </p>
            </div>

            <div className="flex w-full max-w-2xl flex-col gap-3 md:items-end">
              <div className="relative w-full max-w-sm">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tim theo ten, email, trang thai..."
                  className="h-12 w-full rounded-2xl border border-slate-200 py-2 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleExportAttendance()}
                disabled={!selectedSessionId || exporting}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                {exporting ? "Dang export..." : "Export danh sach diem danh"}
              </button>
            </div>
          </div>

          {recordsLoading ? (
            <div className="mt-6 text-sm text-slate-500">Dang tai chi tiet diem danh...</div>
          ) : selectedSession ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700">Co mat</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-900">{summary.present}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">Di muon</p>
                  <p className="mt-2 text-2xl font-bold text-amber-900">{summary.late}</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-sm text-rose-700">Vang</p>
                  <p className="mt-2 text-2xl font-bold text-rose-900">{summary.absent}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-700">Co phep</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{summary.excused}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-4">Sinh vien</th>
                        <th className="px-6 py-4">Trang thai</th>
                        <th className="px-6 py-4">Check-in</th>
                        <th className="px-6 py-4">Ghi chu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((item) => (
                          <tr key={item.enrollment_id} className="hover:bg-slate-50/80">
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900">
                                  {item.student_name || `Sinh vien #${item.student_id || item.enrollment_id}`}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {item.student_email || "Khong co email"}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAttendanceStatusClassName(item.status)}`}
                              >
                                {getAttendanceStatusLabel(item.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {item.check_in_time
                                ? String(item.check_in_time).replace("T", " ").slice(0, 16)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {item.note || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                            Khong co du lieu diem danh phu hop.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
              Chon mot buoi hoc o cot ben trai de xem ket qua diem danh.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
