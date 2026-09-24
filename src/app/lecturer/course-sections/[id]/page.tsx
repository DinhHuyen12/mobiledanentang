"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  Clock3,
  MapPin,
  NotebookPen,
  Save,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { loadLecturerPortalData } from "@/lib/lecturer-portal";
import { useToastMessage } from "@/hooks/use-toast-message";
import { formatScheduleTime, getScheduleDayLabel, getScheduleDayOrder } from "@/lib/schedules";
import { calculateGradePreview, GradePreview } from "@/lib/grades";
import AttendancePanel from "@/components/lecturer/attendance-panel";
import {
  CourseSectionItem,
  EnrollmentItem,
  getCollection,
  GradeItem,
  isActiveEnrollmentStatus,
} from "@/lib/student-portal";

type LecturerScheduleItem = {
  id: number;
  course_section_id?: number;
  subject_name?: string;
  semester_name?: string;
  day_of_week?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
};

type GradeForm = {
  enrollment_id: number;
  attendance_score: number;
  midterm_score: number;
  final_score: number;
};

const initialGradeForm: GradeForm = {
  enrollment_id: 0,
  attendance_score: 0,
  midterm_score: 0,
  final_score: 0,
};

function LecturerGradeModal({
  open,
  submitting,
  courseSectionLabel,
  studentLabel,
  formData,
  gradePreview,
  previewLoading,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  submitting: boolean;
  courseSectionLabel: string;
  studentLabel: string;
  formData: GradeForm;
  gradePreview: GradePreview | null;
  previewLoading: boolean;
  onChange: (field: keyof GradeForm, value: string | number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-500">
              Lecturer Grading
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Nhap hoac cap nhat diem</h2>
            <p className="mt-2 text-sm text-slate-500">
              {studentLabel} | {courseSectionLabel}
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
          <div>
            <label className="text-sm font-medium text-slate-700">Diem chuyen can</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.attendance_score}
              onChange={(event) => onChange("attendance_score", Number(event.target.value))}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Diem giua ky</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.midterm_score}
              onChange={(event) => onChange("midterm_score", Number(event.target.value))}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Diem cuoi ky</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.final_score}
              onChange={(event) => onChange("final_score", Number(event.target.value))}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Tong diem</label>
            <input
              value={gradePreview ? gradePreview.total_score : ""}
              readOnly
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
              placeholder={previewLoading ? "Dang tinh..." : "Tu dong tinh"}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Diem chu</label>
            <input
              type="text"
              value={gradePreview?.letter_grade || ""}
              readOnly
              placeholder={previewLoading ? "Dang tinh..." : "Tu dong quy doi"}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm uppercase text-slate-700 outline-none"
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
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <Save size={16} />
            {submitting ? "Dang luu..." : "Luu diem"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LecturerCourseSectionDetailPage() {
  const params = useParams<{ id: string }>();
  const sectionId = Number(params?.id);

  const [courseSection, setCourseSection] = useState<CourseSectionItem | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [schedules, setSchedules] = useState<LecturerScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [modalMeta, setModalMeta] = useState({
    courseSectionLabel: "",
    studentLabel: "",
  });
  const [gradeForm, setGradeForm] = useState<GradeForm>(initialGradeForm);
  const [gradePreview, setGradePreview] = useState<GradePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useToastMessage(error, "error");
  useToastMessage(message, "success");

  const fetchData = useCallback(async () => {
    if (!sectionId) {
      setError("Hoc phan khong hop le");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [portalData, enrollmentsRes, gradesRes] = await Promise.all([
        loadLecturerPortalData(),
        api.get("/enrollments"),
        api.get("/grades"),
      ]);

      const section =
        portalData.courseSections.find((item) => Number(item.id) === sectionId) || null;

      if (!section) {
        setCourseSection(null);
        setEnrollments([]);
        setGrades([]);
        setSchedules([]);
        setError("Khong tim thay hoc phan hoac ban khong duoc phan cong hoc phan nay");
        return;
      }

      const lecturerEnrollments = (getCollection(enrollmentsRes.data) as EnrollmentItem[]).filter(
        (item) =>
          Number(item.course_section_id) === sectionId && isActiveEnrollmentStatus(item.status)
      );
      const enrollmentIds = new Set(lecturerEnrollments.map((item) => Number(item.id)));
      const sectionGrades = (getCollection(gradesRes.data) as GradeItem[]).filter((item) =>
        enrollmentIds.has(Number(item.enrollment_id))
      );
      const sectionSchedules = (portalData.schedules as LecturerScheduleItem[])
        .filter((item) => Number(item.course_section_id) === sectionId)
        .sort(
          (a, b) =>
            getScheduleDayOrder(a.day_of_week) - getScheduleDayOrder(b.day_of_week) ||
            String(a.start_time || "").localeCompare(String(b.start_time || ""))
        );

      setCourseSection(section);
      setEnrollments(lecturerEnrollments);
      setGrades(sectionGrades);
      setSchedules(sectionSchedules);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc chi tiet hoc phan");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tai duoc chi tiet hoc phan");
      }
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const gradesByEnrollmentId = useMemo(() => {
    const mapping = new Map<number, GradeItem>();
    grades.forEach((item) => {
      mapping.set(Number(item.enrollment_id), item);
    });
    return mapping;
  }, [grades]);

  const filteredEnrollments = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    if (!lowerKeyword) {
      return enrollments;
    }

    return enrollments.filter((item) => {
      const studentName = (item.student_name || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const grade = gradesByEnrollmentId.get(Number(item.id));
      const letterGrade = (grade?.letter_grade || "").toLowerCase();
      return (
        studentName.includes(lowerKeyword) ||
        status.includes(lowerKeyword) ||
        letterGrade.includes(lowerKeyword)
      );
    });
  }, [enrollments, gradesByEnrollmentId, keyword]);

  const stats = useMemo(() => {
    const gradedCount = enrollments.filter((item) =>
      gradesByEnrollmentId.has(Number(item.id))
    ).length;

    return {
      studentCount: enrollments.length,
      gradedCount,
      ungradedCount: Math.max(enrollments.length - gradedCount, 0),
    };
  }, [enrollments, gradesByEnrollmentId]);

  const closeGradeModal = () => {
    setEditingGradeId(null);
    setGradeForm(initialGradeForm);
    setGradePreview(null);
    setPreviewLoading(false);
    setModalMeta({
      courseSectionLabel: "",
      studentLabel: "",
    });
  };

  const openGradeModal = (enrollment: EnrollmentItem) => {
    const existingGrade = gradesByEnrollmentId.get(Number(enrollment.id));
    const label =
      courseSection?.subject_name || courseSection?.subject || `Hoc phan ${courseSection?.id}`;

    setEditingGradeId(existingGrade?.id ?? null);
    setGradeForm({
      enrollment_id: Number(enrollment.id),
      attendance_score: Number(existingGrade?.attendance_score ?? 0),
      midterm_score: Number(existingGrade?.midterm_score ?? 0),
      final_score: Number(existingGrade?.final_score ?? 0),
    });
    setGradePreview(
      existingGrade
        ? {
            attendance_score: Number(existingGrade.attendance_score ?? 0),
            midterm_score: Number(existingGrade.midterm_score ?? 0),
            final_score: Number(existingGrade.final_score ?? 0),
            total_score: Number(existingGrade.total_score ?? 0),
            letter_grade: existingGrade.letter_grade || "",
          }
        : null
    );
    setModalMeta({
      courseSectionLabel: label,
      studentLabel:
        enrollment.student_name || `Sinh vien #${enrollment.student_id || enrollment.id}`,
    });
  };

  const handleGradeInputChange = (field: keyof GradeForm, value: string | number) => {
    setGradeForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateGradeForm = () => {
    if (!gradeForm.enrollment_id) {
      setError("Vui long chon sinh vien can nhap diem");
      return false;
    }

    const scores = [gradeForm.attendance_score, gradeForm.midterm_score, gradeForm.final_score];
    const hasInvalidScore = scores.some(
      (value) => Number.isNaN(value) || Number(value) < 0 || Number(value) > 10
    );

    if (hasInvalidScore) {
      setError("Diem phai nam trong khoang tu 0 den 10");
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!gradeForm.enrollment_id) {
      setGradePreview(null);
      setPreviewLoading(false);
      return;
    }

    const attendance = Number(gradeForm.attendance_score);
    const midterm = Number(gradeForm.midterm_score);
    const finalScore = Number(gradeForm.final_score);

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
  }, [gradeForm.attendance_score, gradeForm.enrollment_id, gradeForm.final_score, gradeForm.midterm_score]);

  const submitGrade = async () => {
    if (submitting || !validateGradeForm()) return;

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = {
        enrollment_id: gradeForm.enrollment_id,
        attendance_score: Number(gradeForm.attendance_score),
        midterm_score: Number(gradeForm.midterm_score),
        final_score: Number(gradeForm.final_score),
      };

      if (editingGradeId) {
        await api.put(`/grades/${editingGradeId}`, payload);
        setMessage("Cap nhat diem thanh cong");
      } else {
        await api.post("/grades", payload);
        setMessage("Nhap diem thanh cong");
      }

      closeGradeModal();
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong luu duoc diem");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong luu duoc diem");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Dang tai chi tiet hoc phan...</div>;
  }

  if (!courseSection) {
    return (
      <div className="space-y-4">
        <Link
          href="/lecturer/course-sections"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Quay lai danh sach hoc phan
        </Link>
        <div className="rounded-3xl bg-red-50 p-4 text-red-600">
          {error || "Khong tim thay hoc phan"}
        </div>
      </div>
    );
  }

  const sectionTitle =
    courseSection.subject_name || courseSection.subject || `Hoc phan ${courseSection.id}`;
  const semesterLabel =
    courseSection.semester_name || courseSection.semester || "Chua co hoc ky";

  return (
    <>
      <div className="space-y-6">
        <Link
          href="/lecturer/course-sections"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Quay lai danh sach hoc phan
        </Link>

        <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.26),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_34%)] p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Course Section Detail
                </p>
                <h1 className="mt-3 text-3xl font-bold">{sectionTitle}</h1>
                <p className="mt-2 text-sm text-slate-300">
                  {semesterLabel} | Ma hoc phan #{courseSection.id}
                </p>
              </div>

              <div className="grid gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Sinh vien</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.studentCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Da co diem</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.gradedCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Suc chua</p>
                  <p className="mt-1 text-2xl font-semibold">{courseSection.max_students ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AttendancePanel sectionId={sectionId} schedules={schedules} />

        <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-500">
                  Student Roster
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Danh sach sinh vien</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Theo doi dang ky hoc va nhap diem cho tung sinh vien trong hoc phan.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tim sinh vien, trang thai, diem chu..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">Sinh vien</th>
                      <th className="px-6 py-4">Trang thai</th>
                      <th className="px-6 py-4">Diem</th>
                      <th className="px-6 py-4">Diem chu</th>
                      <th className="px-6 py-4 text-right">Thao tac</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredEnrollments.length > 0 ? (
                      filteredEnrollments.map((item) => {
                        const grade = gradesByEnrollmentId.get(Number(item.id));

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900">
                                  {item.student_name || `Sinh vien #${item.student_id || item.id}`}
                                </p>
                                <p className="text-sm text-slate-500">Enrollment #{item.id}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                                {item.status || "active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {grade
                                ? `CC ${grade.attendance_score ?? 0} | GK ${grade.midterm_score ?? 0} | CK ${grade.final_score ?? 0} | Tong ${grade.total_score ?? 0}`
                                : "Chua co diem"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  grade?.letter_grade
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {grade?.letter_grade || "Chua nhap"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => openGradeModal(item)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                <NotebookPen size={16} />
                                {grade ? "Sua diem" : "Nhap diem"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                          Chua co sinh vien phu hop trong hoc phan nay.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <BookOpenCheck size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Tong quan hoc phan</h2>
                  <p className="text-sm text-slate-500">Thong tin nhanh de doi chieu</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-slate-500">Mon hoc</span>
                  <span className="font-semibold text-slate-900">{sectionTitle}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-slate-500">Hoc ky</span>
                  <span className="font-semibold text-slate-900">{semesterLabel}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-slate-500">Tong sinh vien</span>
                  <span className="font-semibold text-slate-900">{stats.studentCount}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-slate-500">Chua co diem</span>
                  <span className="font-semibold text-slate-900">{stats.ungradedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Suc chua toi da</span>
                  <span className="font-semibold text-slate-900">{courseSection.max_students ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Lich day hoc phan</h2>
                  <p className="text-sm text-slate-500">Cac buoi hoc dang gan voi hoc phan nay</p>
                </div>
              </div>

              <div className="space-y-3">
                {schedules.length > 0 ? (
                  schedules.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          {getScheduleDayLabel(item.day_of_week)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          Buoi #{item.id}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock3 size={16} className="text-slate-400" />
                          {formatScheduleTime(item.start_time)} - {formatScheduleTime(item.end_time)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          {item.room || "Chua co phong hoc"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    Chua co lich day cho hoc phan nay.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <UsersRound size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Tien do cham diem</h2>
                  <p className="text-sm text-slate-500">Nhac nhanh de hoan tat diem cho lop</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${stats.studentCount > 0 ? (stats.gradedCount / stats.studentCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-slate-500">
                  Da co diem cho{" "}
                  <span className="font-semibold text-slate-900">{stats.gradedCount}</span> /{" "}
                  <span className="font-semibold text-slate-900">{stats.studentCount}</span> sinh vien.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <LecturerGradeModal
        open={gradeForm.enrollment_id > 0}
        submitting={submitting}
        courseSectionLabel={modalMeta.courseSectionLabel}
        studentLabel={modalMeta.studentLabel}
        formData={gradeForm}
        gradePreview={gradePreview}
        previewLoading={previewLoading}
        onChange={handleGradeInputChange}
        onClose={closeGradeModal}
        onSubmit={submitGrade}
      />
    </>
  );
}
