"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  ChevronDown,
  GraduationCap,
  NotebookPen,
  Save,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { useToastMessage } from "@/hooks/use-toast-message";
import { loadLecturerPortalData } from "@/lib/lecturer-portal";
import {
  CourseSectionItem,
  EnrollmentItem,
  getCollection,
  GradeItem,
  isActiveEnrollmentStatus,
} from "@/lib/student-portal";
import { calculateGradePreview, GradePreview } from "@/lib/grades";

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

export default function LecturerCourseSectionsPage() {
  const [courseSections, setCourseSections] = useState<CourseSectionItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
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
    try {
      setLoading(true);
      const [portalData, enrollmentsRes, gradesRes] = await Promise.all([
        loadLecturerPortalData(),
        api.get("/enrollments"),
        api.get("/grades"),
      ]);

      const lecturerSections = portalData.courseSections;
      const lecturerEnrollments = (getCollection(enrollmentsRes.data) as EnrollmentItem[]).filter(
        (item) => isActiveEnrollmentStatus(item.status)
      );
      const allGrades = getCollection(gradesRes.data) as GradeItem[];
      const lecturerEnrollmentIds = new Set(lecturerEnrollments.map((item) => Number(item.id)));

      setCourseSections(lecturerSections);
      setEnrollments(lecturerEnrollments);
      setGrades(
        allGrades.filter((item) => lecturerEnrollmentIds.has(Number(item.enrollment_id)))
      );
      setSelectedSectionId((current) => current ?? lecturerSections[0]?.id ?? null);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc hoc phan phu trach");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tai duoc hoc phan phu trach");
      }
    } finally {
      setLoading(false);
    }
  }, []);

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

  const sectionCards = useMemo(() => {
    return courseSections.map((section) => {
      const items = enrollments.filter(
        (enrollment) => Number(enrollment.course_section_id) === Number(section.id)
      );

      return {
        ...section,
        studentCount: items.length,
        studentsWithGrades: items.filter((item) =>
          gradesByEnrollmentId.has(Number(item.id))
        ).length,
      };
    });
  }, [courseSections, enrollments, gradesByEnrollmentId]);

  const uniqueSectionCards = useMemo(() => {
    const seen = new Set<string>();

    return sectionCards.filter((item) => {
      const compositeKey = [
        item.id,
        item.subject_id,
        item.subject_name || item.subject,
        item.semester_id,
        item.semester_name || item.semester,
        item.room,
        item.schedule,
      ].join("|");

      if (seen.has(compositeKey)) {
        return false;
      }

      seen.add(compositeKey);
      return true;
    });
  }, [sectionCards]);

  const selectedSection = useMemo(() => {
    return uniqueSectionCards.find((item) => Number(item.id) === Number(selectedSectionId)) || null;
  }, [uniqueSectionCards, selectedSectionId]);

  const filteredEnrollments = useMemo(() => {
    if (!selectedSection) return [];

    const lowerKeyword = keyword.trim().toLowerCase();
    const sectionEnrollments = enrollments.filter(
      (item) => Number(item.course_section_id) === Number(selectedSection.id)
    );

    if (!lowerKeyword) {
      return sectionEnrollments;
    }

    return sectionEnrollments.filter((item) => {
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
  }, [selectedSection, enrollments, keyword, gradesByEnrollmentId]);

  const resetModal = () => {
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
    const section = courseSections.find(
      (item) => Number(item.id) === Number(enrollment.course_section_id)
    );

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
      courseSectionLabel:
        section?.subject_name ||
        section?.subject ||
        selectedSection?.subject_name ||
        selectedSection?.subject ||
        `Hoc phan ${enrollment.course_section_id}`,
      studentLabel: enrollment.student_name || `Sinh vien #${enrollment.student_id || enrollment.id}`,
    });
  };

  const closeGradeModal = () => {
    resetModal();
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
    return <div className="text-sm text-slate-500">Dang tai hoc phan phu trach...</div>;
  }

  if (error && courseSections.length === 0) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">Teaching Sections</p>
          <h1 className="mt-3 text-3xl font-bold">Hoc phan phu trach</h1>
          <p className="mt-2 text-sm text-white/80">
            Theo doi danh sach sinh vien va nhap diem truc tiep cho tung hoc phan.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tong hoc phan</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{uniqueSectionCards.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tong sinh vien dang hoc</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{enrollments.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Ban ghi diem da co</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{grades.length}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr,1.7fr]">
          <div className="space-y-4">
            {uniqueSectionCards.length > 0 ? (
              uniqueSectionCards.map((item) => {
                const isActive = Number(selectedSectionId) === Number(item.id);
                const title = item.subject_name || item.subject || `Hoc phan ${item.id}`;
                const semester = item.semester_name || item.semester || "Chua co hoc ky";

                return (
                  <button
                    key={[
                      item.id,
                      item.subject_id,
                      item.semester_id,
                      item.room,
                      item.schedule,
                    ].join("-")}
                    type="button"
                    onClick={() => setSelectedSectionId(Number(item.id))}
                    className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${
                      isActive
                        ? "border-emerald-200 bg-emerald-50/70 ring-4 ring-emerald-100"
                        : "border-white bg-white hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-2xl p-3 ${
                            isActive ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          <BookOpenCheck size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                          <p className="mt-1 text-sm text-slate-500">{semester}</p>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`mt-1 shrink-0 text-slate-400 transition ${isActive ? "rotate-180" : ""}`}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-700">
                        <UsersRound size={14} />
                        {item.studentCount} sinh vien
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-700">
                        <NotebookPen size={14} />
                        {item.studentsWithGrades}/{item.studentCount} da co diem
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-700">
                        <GraduationCap size={14} />
                        Suc chua: {item.max_students ?? 0}
                      </span>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/lecturer/course-sections/${item.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Xem chi tiet
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
                Giang vien chua duoc phan cong hoc phan nao.
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            {selectedSection ? (
              <>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-emerald-500">
                      Class Roster
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {selectedSection.subject_name ||
                        selectedSection.subject ||
                        `Hoc phan ${selectedSection.id}`}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedSection.semester_name ||
                        selectedSection.semester ||
                        "Chua co hoc ky"}{" "}
                      | {filteredEnrollments.length} sinh vien hien thi
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
                                    <p className="text-sm text-slate-500">
                                      Enrollment #{item.id}
                                    </p>
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
              </>
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm text-slate-500">
                Chon mot hoc phan ben trai de xem danh sach sinh vien va nhap diem.
              </div>
            )}
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
