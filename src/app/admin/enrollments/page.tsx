"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { getEnrollmentTypeClassName, getEnrollmentTypeLabel } from "@/lib/student-portal";
import {
  BookCheck,
  ClipboardCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type EnrollmentItem = {
  id: number;
  student_id?: number;
  student_name?: string;
  course_section_id?: number;
  subject_name?: string;
  semester_name?: string;
  status?: string;
  is_retake?: boolean;
  is_improvement?: boolean;
  enrollment_type?: "hoc_di" | "hoc_lai" | "hoc_cai_thien" | string;
};

type StudentOption = {
  id: number;
  full_name?: string;
  username?: string;
};

type ClassOption = {
  id: number;
  name?: string;
  class_name?: string;
  class_code?: string;
};

type CourseSectionOption = {
  id: number;
  subject?: string;
  semester?: string;
};

type EnrollmentForm = {
  student_id: number;
  class_id: number;
  course_section_id: number;
  status: string;
};

const initialForm: EnrollmentForm = {
  student_id: 0,
  class_id: 0,
  course_section_id: 0,
  status: "active",
};

function EnrollmentModal({
  title,
  open,
  submitting,
  students,
  classes,
  courseSections,
  formData,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  open: boolean;
  submitting: boolean;
  students: StudentOption[];
  classes: ClassOption[];
  courseSections: CourseSectionOption[];
  formData: EnrollmentForm;
  onChange: (field: keyof EnrollmentForm, value: string | number) => void;
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
            <p className="text-sm text-slate-500">Nhap thong tin dang ky hoc</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6">
          <div>
            <label className="text-sm font-medium">Sinh vien</label>
            <select
              value={formData.student_id || ""}
              onChange={(e) => onChange("student_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Chon sinh vien</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name || student.username || `Student ${student.id}`}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Chon sinh vien de xu ly le, hoac chon lop ben duoi de xep chinh khoa ca lop.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Lop hoc</label>
            <select
              value={formData.class_id || ""}
              onChange={(e) => onChange("class_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Khong xep ca lop</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name ||
                    classItem.class_name ||
                    classItem.class_code ||
                    `Lop ${classItem.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Lop hoc phan</label>
            <select
              value={formData.course_section_id || ""}
              onChange={(e) => onChange("course_section_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Chon hoc phan</option>
              {courseSections.map((section, index) => (
                <option
                  key={[
                    section.id,
                    section.subject || "",
                    section.semester || "",
                    index,
                  ].join("-")}
                  value={section.id}
                >
                  {(section.subject || `Section ${section.id}`) +
                    (section.semester ? ` - ${section.semester}` : "")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Trang thai</label>
            <select
              value={formData.status}
              onChange={(e) => onChange("status", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="pending">pending - cho duyet</option>
              <option value="active">active - da duyet/dang hoc</option>
              <option value="rejected">rejected - tu choi</option>
              <option value="cancelled">cancelled - da huy</option>
              <option value="completed">completed - hoan thanh</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Huy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-white"
          >
            {submitting ? "Dang luu..." : "Luu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSectionOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EnrollmentForm>(initialForm);

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

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");
      const res = await api.get("/enrollments");
      setEnrollments(getCollection(res.data));
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong tai duoc danh sach dang ky hoc");
      } else {
        setMessage("Khong tai duoc danh sach dang ky hoc");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [studentsRes, sectionsRes, classesRes] = await Promise.all([
        api.get("/student-info"),
        api.get("/course-sections"),
        api.get("/classes"),
      ]);
      setStudents(getCollection(studentsRes.data));
      setCourseSections(getCollection(sectionsRes.data));
      setClasses(getCollection(classesRes.data));
    } catch {}
  }, []);

  useEffect(() => {
    fetchEnrollments();
    fetchLookups();
  }, [fetchEnrollments, fetchLookups]);

  const filteredEnrollments = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return enrollments.filter((item) => {
      const student = (item.student_name || "").toLowerCase();
      const subject = (item.subject_name || "").toLowerCase();
      const semester = (item.semester_name || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      return (
        student.includes(lowerKeyword) ||
        subject.includes(lowerKeyword) ||
        semester.includes(lowerKeyword) ||
        status.includes(lowerKeyword)
      );
    });
  }, [enrollments, keyword]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof EnrollmentForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if ((!formData.student_id && !formData.class_id) || !formData.course_section_id || !formData.status.trim()) {
      setMessageType("error");
      setMessage("Vui long chon sinh vien hoac lop, hoc phan va trang thai");
      return false;
    }
    return true;
  };

  const submitForm = async (mode: "add" | "edit") => {
    if (submitting || !validateForm()) return;
    if (mode === "edit" && !editingId) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");
      const payload = {
        student_id: formData.class_id ? undefined : Number(formData.student_id),
        class_id: formData.class_id ? Number(formData.class_id) : undefined,
        course_section_id: Number(formData.course_section_id),
        status: formData.status.trim(),
      };

      if (mode === "add") {
        await api.post("/enrollments", payload);
        toast.success("Them dang ky hoc thanh cong");
        setMessage("Them dang ky hoc thanh cong");
      } else {
        await api.put(`/enrollments/${editingId}`, payload);
        toast.success("Cap nhat dang ky hoc thanh cong");
        setMessage("Cap nhat dang ky hoc thanh cong");
      }

      setMessageType("success");
      closeAllModals();
      fetchEnrollments();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            (mode === "add" ? "Them dang ky hoc that bai" : "Cap nhat dang ky hoc that bai")
        );
      } else {
        setMessage(mode === "add" ? "Them dang ky hoc that bai" : "Cap nhat dang ky hoc that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa dang ky hoc nay khong?")) return;
    try {
      await api.delete(`/enrollments/${id}`);
      toast.success("Xoa dang ky hoc thanh cong");
      setMessage("Xoa dang ky hoc thanh cong");
      setMessageType("success");
      fetchEnrollments();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xoa dang ky hoc that bai");
      } else {
        setMessage("Xoa dang ky hoc that bai");
      }
    }
  };

  const openEdit = (item: EnrollmentItem) => {
    setEditingId(item.id);
    setFormData({
      student_id: item.student_id ?? 0,
      class_id: 0,
      course_section_id: item.course_section_id ?? 0,
      status: item.status || "",
    });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-6 text-white shadow-lg shadow-cyan-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <ClipboardCheck size={24} />
                </div>
                Quan ly dang ky hoc
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/85">
                Theo doi sinh vien da dang ky hoc phan nao va trang thai hien tai.
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setOpenAddModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-teal-700 shadow-lg transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              Them dang ky
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tim theo sinh vien, mon hoc, hoc ky..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none transition focus:border-cyan-400 focus:bg-white"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Tong dang ky: <span className="font-semibold text-slate-800">{enrollments.length}</span>
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
                    <th className="px-6 py-4">Hoc phan</th>
                    <th className="px-6 py-4">Hoc ky</th>
                    <th className="px-6 py-4">Loai</th>
                    <th className="px-6 py-4">Trang thai</th>
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
                  ) : filteredEnrollments.length > 0 ? (
                    filteredEnrollments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-600">
                              <UserRound size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.student_name || `Student ${item.student_id}`}
                              </p>
                              <p className="text-sm text-slate-500">ID {item.student_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <BookCheck size={16} className="text-cyan-500" />
                            {item.subject_name || `Section ${item.course_section_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.semester_name || "-"}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getEnrollmentTypeClassName(item)}`}
                          >
                            {getEnrollmentTypeLabel(item)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                            {item.status || "-"}
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
                        Khong co dang ky hoc phu hop
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <EnrollmentModal
        title="Them dang ky hoc"
        open={openAddModal}
        submitting={submitting}
        students={students}
        classes={classes}
        courseSections={courseSections}
        formData={formData}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={() => submitForm("add")}
      />

      <EnrollmentModal
        title="Cap nhat dang ky hoc"
        open={openEditModal}
        submitting={submitting}
        students={students}
        classes={classes}
        courseSections={courseSections}
        formData={formData}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={() => submitForm("edit")}
      />
    </>
  );
}
