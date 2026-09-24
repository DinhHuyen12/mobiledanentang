"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, MapPin, Plus, Save, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { useToastMessage } from "@/hooks/use-toast-message";
import { formatScheduleTime, getScheduleDayLabel } from "@/lib/schedules";
import ConfirmDialog from "@/components/app/confirm-dialog";

type ScheduleOption = {
  id: number;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
};

type AttendanceSessionItem = {
  id: number;
  course_section_id?: number;
  schedule_id?: number | null;
  session_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  room?: string | null;
  topic?: string | null;
  status?: string | null;
};

type AttendanceRecordItem = {
  enrollment_id: number;
  student_id?: number;
  student_name?: string;
  student_email?: string;
  attendance_record_id?: number | null;
  status?: string | null;
  check_in_time?: string | null;
  note?: string | null;
};

type AttendanceForm = {
  schedule_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  room: string;
  topic: string;
  status: "open" | "closed";
};

const initialAttendanceForm: AttendanceForm = {
  schedule_id: "",
  session_date: "",
  start_time: "",
  end_time: "",
  room: "",
  topic: "",
  status: "open",
};

function AttendanceSessionModal({
  open,
  formData,
  schedules,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  formData: AttendanceForm;
  schedules: ScheduleOption[];
  submitting: boolean;
  onChange: (field: keyof AttendanceForm, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-500">
              Attendance Session
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Tao buoi diem danh</h2>
            <p className="mt-2 text-sm text-slate-500">
              Tao buoi hoc de diem danh va theo doi tinh hinh len lop.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Lich hoc gan san</label>
            <select
              value={formData.schedule_id}
              onChange={(event) => onChange("schedule_id", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="">Khong gan lich co san</option>
              {schedules.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {getScheduleDayLabel(item.day_of_week)} | {formatScheduleTime(item.start_time)} -{" "}
                  {formatScheduleTime(item.end_time)} | {item.room || "Chua co phong"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Ngay hoc</label>
            <input
              type="date"
              value={formData.session_date}
              onChange={(event) => onChange("session_date", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Trang thai</label>
            <select
              value={formData.status}
              onChange={(event) => onChange("status", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="open">open</option>
              <option value="closed">closed</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Gio bat dau</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(event) => onChange("start_time", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Gio ket thuc</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(event) => onChange("end_time", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Phong hoc</label>
            <input
              value={formData.room}
              onChange={(event) => onChange("room", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="Vi du A101"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Chu de</label>
            <input
              value={formData.topic}
              onChange={(event) => onChange("topic", event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="Vi du Buoi 1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Huy
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            <Plus size={16} />
            {submitting ? "Dang tao..." : "Tao buoi diem danh"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePanel({
  sectionId,
  schedules,
}: {
  sectionId: number;
  schedules: ScheduleOption[];
}) {
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceSessionItem | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [attendanceUnavailable, setAttendanceUnavailable] = useState(false);
  const [formData, setFormData] = useState<AttendanceForm>(initialAttendanceForm);

  useToastMessage(message, "success");
  useToastMessage(error, "error");

  const fetchSessions = useCallback(async () => {
    if (!sectionId) return;

    try {
      setLoading(true);
      const response = await api.get("/attendance-sessions", {
        params: {
          course_section_id: sectionId,
        },
      });
      const payload = response.data;
      const nextSessions = Array.isArray(payload)
        ? (payload as AttendanceSessionItem[])
        : Array.isArray((payload as { data?: unknown[] })?.data)
          ? ((payload as { data: AttendanceSessionItem[] }).data || [])
          : [];

      setSessions(nextSessions);
      setAttendanceUnavailable(false);
      setSelectedSessionId((current) => {
        if (current && nextSessions.some((item) => Number(item.id) === Number(current))) {
          return current;
        }
        return nextSessions[0]?.id ?? null;
      });
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setAttendanceUnavailable(true);
        setSessions([]);
        setSelectedSessionId(null);
        setRecords([]);
        setError("");
        return;
      }
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
  }, [sectionId]);

  const fetchRecords = useCallback(async (sessionId: number | null) => {
    if (!sessionId) {
      setRecords([]);
      return;
    }

    try {
      setRecordsLoading(true);
      const response = await api.get(`/attendance-sessions/${sessionId}/records`);
      const payload = response.data as { records?: AttendanceRecordItem[] };
      setRecords(
        (payload.records || []).map((item) => ({
          ...item,
          status: item.status || "present",
          check_in_time: item.check_in_time || "",
          note: item.note || "",
        }))
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setAttendanceUnavailable(true);
        setRecords([]);
        setError("");
        return;
      }
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc bang diem danh");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tai duoc bang diem danh");
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

  const selectedSession = useMemo(
    () => sessions.find((item) => Number(item.id) === Number(selectedSessionId)) || null,
    [selectedSessionId, sessions]
  );

  const summary = useMemo(() => {
    const present = records.filter((item) => item.status === "present").length;
    const late = records.filter((item) => item.status === "late").length;
    const absent = records.filter((item) => item.status === "absent").length;
    const excused = records.filter((item) => item.status === "excused").length;

    return { present, late, absent, excused };
  }, [records]);

  const handleFormChange = (field: keyof AttendanceForm, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "schedule_id") {
        const selectedSchedule = schedules.find((item) => Number(item.id) === Number(value));
        if (selectedSchedule) {
          next.start_time = String(selectedSchedule.start_time || "").slice(0, 5);
          next.end_time = String(selectedSchedule.end_time || "").slice(0, 5);
          next.room = selectedSchedule.room || "";
        }
      }
      return next;
    });
  };

  const closeCreateModal = () => {
    setFormData(initialAttendanceForm);
    setShowCreateModal(false);
  };

  const handleCreateSession = async () => {
    if (!formData.session_date || creating) {
      if (!formData.session_date) {
        setError("Vui long chon ngay hoc");
      }
      return;
    }

    try {
      setCreating(true);
      const response = await api.post("/attendance-sessions", {
        course_section_id: sectionId,
        schedule_id: formData.schedule_id ? Number(formData.schedule_id) : undefined,
        session_date: formData.session_date,
        start_time: formData.start_time ? `${formData.start_time}:00` : undefined,
        end_time: formData.end_time ? `${formData.end_time}:00` : undefined,
        room: formData.room.trim() || undefined,
        topic: formData.topic.trim() || undefined,
        status: formData.status,
      });

      const createdSession = (response.data as { data?: AttendanceSessionItem })?.data;
      setMessage("Tao buoi diem danh thanh cong");
      closeCreateModal();
      await fetchSessions();
      if (createdSession?.id) {
        setSelectedSessionId(Number(createdSession.id));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tao duoc buoi diem danh");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tao duoc buoi diem danh");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRecordChange = (
    enrollmentId: number,
    field: "status" | "check_in_time" | "note",
    value: string
  ) => {
    setRecords((prev) =>
      prev.map((item) =>
        Number(item.enrollment_id) === Number(enrollmentId) ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveRecords = async () => {
    if (!selectedSessionId || saving) return;

    try {
      setSaving(true);
      await api.put(`/attendance-sessions/${selectedSessionId}/records`, {
        records: records.map((item) => ({
          enrollment_id: item.enrollment_id,
          status: item.status || "present",
          check_in_time: item.check_in_time || null,
          note: item.note || null,
        })),
      });
      setMessage("Cap nhat diem danh thanh cong");
      await fetchRecords(selectedSessionId);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong luu duoc diem danh");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong luu duoc diem danh");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteTarget) return;

    try {
      setCreating(true);
      await api.delete(`/attendance-sessions/${deleteTarget.id}`);
      setMessage("Xoa buoi diem danh thanh cong");
      setDeleteTarget(null);
      await fetchSessions();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong xoa duoc buoi diem danh");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong xoa duoc buoi diem danh");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {attendanceUnavailable ? null : (
      <section className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-500">
                Attendance
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Buoi diem danh</h2>
              <p className="mt-2 text-sm text-slate-500">
                Tao va quan ly cac buoi hoc de diem danh sinh vien.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <Plus size={16} />
              Tao buoi moi
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Dang tai buoi diem danh...</div>
            ) : sessions.length > 0 ? (
              sessions.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-4 py-4 transition ${
                    Number(item.id) === Number(selectedSessionId)
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSessionId(Number(item.id))}
                      className="flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {String(item.session_date || "").slice(0, 10) || "Chua co ngay"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            String(item.status || "").toLowerCase() === "closed"
                              ? "bg-slate-200 text-slate-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.status || "open"}
                        </span>
                      </div>
                      <p className="mt-3 font-semibold text-slate-900">
                        {item.topic || `Buoi diem danh #${item.id}`}
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock3 size={14} className="text-slate-400" />
                          {String(item.start_time || "").slice(0, 5) || "--:--"} -{" "}
                          {String(item.end_time || "").slice(0, 5) || "--:--"}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400" />
                          {item.room || "Chua co phong"}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="rounded-2xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chua co buoi diem danh nao. Ban co the tao buoi dau tien ngay bay gio.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-500">
                Attendance Roster
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Bang diem danh</h2>
              <p className="mt-2 text-sm text-slate-500">
                Chon mot buoi diem danh de cap nhat trang thai cho tung sinh vien.
              </p>
            </div>

            {selectedSession ? (
              <button
                type="button"
                onClick={handleSaveRecords}
                disabled={saving || recordsLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                <Save size={16} />
                {saving ? "Dang luu..." : "Luu diem danh"}
              </button>
            ) : null}
          </div>

          {selectedSession ? (
            <>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
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

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {selectedSession.topic || `Buoi diem danh #${selectedSession.id}`}
                </span>
                <span className="mx-2">|</span>
                {String(selectedSession.session_date || "").slice(0, 10)}
                <span className="mx-2">|</span>
                {String(selectedSession.start_time || "").slice(0, 5) || "--:--"} -{" "}
                {String(selectedSession.end_time || "").slice(0, 5) || "--:--"}
              </div>

              {recordsLoading ? (
                <div className="mt-6 text-sm text-slate-500">Dang tai bang diem danh...</div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                          <th className="px-4 py-4">Sinh vien</th>
                          <th className="px-4 py-4">Trang thai</th>
                          <th className="px-4 py-4">Check-in</th>
                          <th className="px-4 py-4">Ghi chu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {records.length > 0 ? (
                          records.map((record) => (
                            <tr key={record.enrollment_id} className="hover:bg-slate-50/80">
                              <td className="px-4 py-4">
                                <div className="space-y-1">
                                  <p className="font-semibold text-slate-900">
                                    {record.student_name ||
                                      `Sinh vien #${record.student_id || record.enrollment_id}`}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {record.student_email || "Khong co email"}
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={record.status || "present"}
                                  onChange={(event) =>
                                    handleRecordChange(
                                      record.enrollment_id,
                                      "status",
                                      event.target.value
                                    )
                                  }
                                  className="h-10 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                >
                                  <option value="present">present</option>
                                  <option value="late">late</option>
                                  <option value="absent">absent</option>
                                  <option value="excused">excused</option>
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="datetime-local"
                                  value={String(record.check_in_time || "").slice(0, 16)}
                                  onChange={(event) =>
                                    handleRecordChange(
                                      record.enrollment_id,
                                      "check_in_time",
                                      event.target.value
                                    )
                                  }
                                  className="h-10 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  value={record.note || ""}
                                  onChange={(event) =>
                                    handleRecordChange(
                                      record.enrollment_id,
                                      "note",
                                      event.target.value
                                    )
                                  }
                                  className="h-10 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                                  placeholder="Ghi chu..."
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                              Chua co sinh vien de diem danh trong buoi nay.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
              Chon mot buoi diem danh o ben trai de xem roster va cap nhat trang thai.
            </div>
          )}
        </div>
      </section>
      )}

      <AttendanceSessionModal
        open={showCreateModal}
        formData={formData}
        schedules={schedules}
        submitting={creating}
        onChange={handleFormChange}
        onClose={closeCreateModal}
        onSubmit={handleCreateSession}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoa buoi diem danh"
        description={
          deleteTarget
            ? `Ban co chac muon xoa ${
                deleteTarget.topic || `buoi diem danh #${deleteTarget.id}`
              } khong?`
            : ""
        }
        confirmLabel="Xoa buoi"
        cancelLabel="Dong"
        tone="danger"
        loading={creating}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSession}
      />
    </>
  );
}
