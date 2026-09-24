"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import {
  Award,
  Download,
  FileBarChart,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";
import { calculateGradePreview, GradePreview } from "@/lib/grades";
import { isActiveEnrollmentStatus } from "@/lib/student-portal";

type GradeItem = {
  id: number;
  enrollment_id?: number;
  student_id?: number;
  student_name?: string;
  subject_code?: string;
  credits?: number;
  semester_name?: string;
  subject_name?: string;
  attendance_score?: number;
  midterm_score?: number;
  final_score?: number;
  total_score?: number;
  letter_grade?: string;
};

type EnrollmentOption = {
  id: number;
  student_id?: number;
  student_name?: string;
  subject_name?: string;
  status?: string;
};

type GradeForm = {
  enrollment_id: number;
  attendance_score: number;
  midterm_score: number;
  final_score: number;
};

const initialForm: GradeForm = {
  enrollment_id: 0,
  attendance_score: 0,
  midterm_score: 0,
  final_score: 0,
};

const GRADE_POINTS: Record<string, number> = {
  A: 4.0,
  "B+": 3.5,
  B: 3.0,
  "C+": 2.5,
  C: 2.0,
  "D+": 1.5,
  D: 1.0,
  F: 0,
};

function getAcademicStandingLabel(gpa: number) {
  if (gpa < 2) return "Canh bao hoc vu";
  if (gpa >= 3.6) return "Xuat sac";
  if (gpa >= 3.2) return "Gioi";
  if (gpa >= 2.5) return "Kha";
  return "Binh thuong";
}

function escapeCsvValue(value: string | number) {
  const normalized = String(value ?? "");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function GradeModal({
  title,
  open,
  submitting,
  enrollments,
  formData,
  gradePreview,
  previewLoading,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  open: boolean;
  submitting: boolean;
  enrollments: EnrollmentOption[];
  formData: GradeForm;
  gradePreview: GradePreview | null;
  previewLoading: boolean;
  onChange: (field: keyof GradeForm, value: string | number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">Nhap thong tin diem</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Dang ky hoc</label>
            <select
              value={formData.enrollment_id || ""}
              onChange={(e) => onChange("enrollment_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Chon dang ky hoc</option>
              {enrollments.map((item) => (
                <option key={item.id} value={item.id}>
                  {(item.student_name || `Enrollment ${item.id}`) +
                    (item.subject_name ? ` - ${item.subject_name}` : "")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Diem chuyen can</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.attendance_score}
              onChange={(e) => onChange("attendance_score", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Diem giua ky</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.midterm_score}
              onChange={(e) => onChange("midterm_score", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Diem cuoi ky</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.final_score}
              onChange={(e) => onChange("final_score", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tong diem</label>
            <input
              value={gradePreview ? gradePreview.total_score : ""}
              readOnly
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
              placeholder={previewLoading ? "Dang tinh..." : "Tu dong tinh"}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Diem chu</label>
            <input
              value={gradePreview?.letter_grade || ""}
              readOnly
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
              placeholder={previewLoading ? "Dang tinh..." : "Tu dong quy doi"}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Huy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-fuchsia-600 px-4 py-2 text-white"
          >
            {submitting ? "Dang luu..." : "Luu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<GradeForm>(initialForm);
  const [gradePreview, setGradePreview] = useState<GradePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedExportStudentId, setSelectedExportStudentId] = useState<number>(0);
  const [exporting, setExporting] = useState(false);

  useToastMessage(message, messageType);

  const getCollection = (payload: unknown) => {
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
  };

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");
      const res = await api.get("/grades");
      setGrades(getCollection(res.data));
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong tai duoc danh sach diem");
      } else {
        setMessage("Khong tai duoc danh sach diem");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const res = await api.get("/enrollments");
      setEnrollments(
        (getCollection(res.data) as EnrollmentOption[]).filter((item) =>
          isActiveEnrollmentStatus(item.status)
        )
      );
    } catch {}
  }, []);

  useEffect(() => {
    fetchGrades();
    fetchLookups();
  }, [fetchGrades, fetchLookups]);

  const filteredGrades = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return grades.filter((item) => {
      const student = (item.student_name || "").toLowerCase();
      const subject = (item.subject_name || "").toLowerCase();
      const letter = (item.letter_grade || "").toLowerCase();
      return (
        student.includes(lowerKeyword) ||
        subject.includes(lowerKeyword) ||
        letter.includes(lowerKeyword)
      );
    });
  }, [grades, keyword]);

  const exportStudents = useMemo(() => {
    const mapping = new Map<number, string>();

    enrollments.forEach((item) => {
      const studentId = Number(item.student_id);
      if (!studentId || mapping.has(studentId)) return;
      mapping.set(studentId, item.student_name || `Sinh vien ${studentId}`);
    });

    return Array.from(mapping.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [enrollments]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setGradePreview(null);
    setPreviewLoading(false);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof GradeForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (
      !formData.enrollment_id ||
      Number.isNaN(formData.attendance_score) ||
      Number.isNaN(formData.midterm_score) ||
      Number.isNaN(formData.final_score)
    ) {
      setMessageType("error");
      setMessage("Vui long nhap day du thong tin diem");
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    enrollment_id: Number(formData.enrollment_id),
    attendance_score: Number(formData.attendance_score),
    midterm_score: Number(formData.midterm_score),
    final_score: Number(formData.final_score),
  });

  useEffect(() => {
    if (!(openAddModal || openEditModal)) return;

    const attendance = Number(formData.attendance_score);
    const midterm = Number(formData.midterm_score);
    const finalScore = Number(formData.final_score);

    if (Number.isNaN(attendance) || Number.isNaN(midterm) || Number.isNaN(finalScore)) {
      setGradePreview(null);
      setPreviewLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setPreviewLoading(true);
        const preview = await calculateGradePreview(attendance, midterm, finalScore);
        setGradePreview(preview);
      } catch {
        setGradePreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [formData.attendance_score, formData.final_score, formData.midterm_score, openAddModal, openEditModal]);

  const submitForm = async (mode: "add" | "edit") => {
    if (submitting || !validateForm()) return;
    if (mode === "edit" && !editingId) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      if (mode === "add") {
        await api.post("/grades", buildPayload());
        toast.success("Them diem thanh cong");
        setMessage("Them diem thanh cong");
      } else {
        await api.put(`/grades/${editingId}`, buildPayload());
        toast.success("Cap nhat diem thanh cong");
        setMessage("Cap nhat diem thanh cong");
      }

      setMessageType("success");
      closeAllModals();
      fetchGrades();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            (mode === "add" ? "Them diem that bai" : "Cap nhat diem that bai")
        );
      } else {
        setMessage(mode === "add" ? "Them diem that bai" : "Cap nhat diem that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa diem nay khong?")) return;
    try {
      await api.delete(`/grades/${id}`);
      toast.success("Xoa diem thanh cong");
      setMessage("Xoa diem thanh cong");
      setMessageType("success");
      fetchGrades();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xoa diem that bai");
      } else {
        setMessage("Xoa diem that bai");
      }
    }
  };

  const handleExportTranscript = async () => {
    if (!selectedExportStudentId) {
      toast.error("Vui long chon sinh vien truoc khi export");
      return;
    }

    if (exporting) return;

    try {
      setExporting(true);

      const studentGrades = grades
        .filter((item) => Number(item.student_id) === Number(selectedExportStudentId))
        .sort((left, right) => {
          return (
            String(left.semester_name || "").localeCompare(String(right.semester_name || "")) ||
            String(left.subject_name || "").localeCompare(String(right.subject_name || ""))
          );
        });

      if (studentGrades.length === 0) {
        toast.error("Sinh vien nay chua co du lieu diem de export");
        return;
      }

      const bestBySubject = new Map<number, GradeItem>();

      studentGrades.forEach((item) => {
        const subjectKey = Number(item.enrollment_id || item.id);
        const existing = bestBySubject.get(subjectKey);
        if (!existing || Number(item.total_score || 0) > Number(existing.total_score || 0)) {
          bestBySubject.set(subjectKey, item);
        }
      });

      const bestAttempts = Array.from(bestBySubject.values());
      const attemptedCredits = bestAttempts.reduce(
        (sum, item) => sum + Number(item.credits || 0),
        0
      );
      const earnedCredits = bestAttempts
        .filter((item) => Number(item.total_score || 0) >= 4)
        .reduce((sum, item) => sum + Number(item.credits || 0), 0);
      const totalQualityPoints = bestAttempts.reduce((sum, item) => {
        const points = GRADE_POINTS[String(item.letter_grade || "").toUpperCase()] ?? 0;
        return sum + Number(item.credits || 0) * points;
      }, 0);
      const cumulativeGpa =
        attemptedCredits > 0 ? (totalQualityPoints / attemptedCredits).toFixed(2) : "0.00";

      const rows = [
        [
          "STT",
          "Sinh vien",
          "Ma mon",
          "Mon hoc",
          "Hoc ky",
          "So tin chi",
          "Diem chuyen can",
          "Diem giua ky",
          "Diem cuoi ky",
          "Tong diem",
          "Diem chu",
        ],
        ...studentGrades.map((item, index) => [
          index + 1,
          item.student_name || "",
          item.subject_code || "",
          item.subject_name || "",
          item.semester_name || "",
          Number(item.credits || 0),
          Number(item.attendance_score || 0),
          Number(item.midterm_score || 0),
          Number(item.final_score || 0),
          Number(item.total_score || 0),
          item.letter_grade || "",
        ]),
        [],
        ["Tong ket hoc tap"],
        ["Tong so mon", bestAttempts.length],
        ["Tong tin chi da hoc", attemptedCredits],
        ["Tin chi dat", earnedCredits],
        ["Diem GPA tich luy", cumulativeGpa],
        ["Xep loai", getAcademicStandingLabel(Number(cumulativeGpa))],
      ];

      const csvContent = `\uFEFF${rows
        .map((row) => row.map((cell) => escapeCsvValue(cell ?? "")).join(","))
        .join("\r\n")}`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `bang-diem-${selectedExportStudentId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Export bang diem thanh cong");
    } finally {
      setExporting(false);
    }
  };

  const openEdit = (item: GradeItem) => {
    setEditingId(item.id);
    setFormData({
      enrollment_id: item.enrollment_id ?? 0,
      attendance_score: Number(item.attendance_score ?? 0),
      midterm_score: Number(item.midterm_score ?? 0),
      final_score: Number(item.final_score ?? 0),
    });
    setGradePreview({
      attendance_score: Number(item.attendance_score ?? 0),
      midterm_score: Number(item.midterm_score ?? 0),
      final_score: Number(item.final_score ?? 0),
      total_score: Number(item.total_score ?? 0),
      letter_grade: item.letter_grade || "",
    });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 p-6 text-white shadow-lg shadow-fuchsia-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <Award size={24} />
                </div>
                Quan ly diem
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/85">
                Theo doi diem giua ky, cuoi ky, tong diem va diem chu cua sinh vien.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedExportStudentId || ""}
                onChange={(e) => setSelectedExportStudentId(Number(e.target.value))}
                className="rounded-2xl border border-white/30 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none"
              >
                <option value="">Chon sinh vien de export</option>
                {exportStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => void handleExportTranscript()}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-fuchsia-700 shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={18} />
                {exporting ? "Dang export..." : "Export bang diem"}
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setOpenAddModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-fuchsia-700 shadow-lg transition hover:-translate-y-0.5"
              >
                <Plus size={18} />
                Them diem
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tim theo sinh vien, mon hoc, diem chu..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none transition focus:border-fuchsia-400 focus:bg-white"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Tong diem: <span className="font-semibold text-slate-800">{grades.length}</span>
            </div>
          </div>

          {message && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Sinh vien</th>
                  <th className="px-6 py-4">Mon hoc</th>
                  <th className="px-6 py-4">Chuyen can</th>
                  <th className="px-6 py-4">Diem</th>
                  <th className="px-6 py-4">Diem chu</th>
                  <th className="px-6 py-4 text-right">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                        Dang tai du lieu...
                      </td>
                    </tr>
                  ) : filteredGrades.length > 0 ? (
                    filteredGrades.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-600">
                              <UserRound size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{item.student_name || `Enrollment ${item.enrollment_id}`}</p>
                              <p className="text-sm text-slate-500">ID {item.enrollment_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <FileBarChart size={16} className="text-fuchsia-500" />
                            {item.subject_name || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {item.attendance_score ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          GK: {item.midterm_score ?? 0} | CK: {item.final_score ?? 0} | Tong: {item.total_score ?? 0}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                            {item.letter_grade || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                        Khong co diem phu hop
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <GradeModal
        title="Them diem"
        open={openAddModal}
        submitting={submitting}
        enrollments={enrollments}
        formData={formData}
        gradePreview={gradePreview}
        previewLoading={previewLoading}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={() => submitForm("add")}
      />

      <GradeModal
        title="Cap nhat diem"
        open={openEditModal}
        submitting={submitting}
        enrollments={enrollments}
        formData={formData}
        gradePreview={gradePreview}
        previewLoading={previewLoading}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={() => submitForm("edit")}
      />
    </>
  );
}
