"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  GraduationCap,
  Building2,
  Hash,
} from "lucide-react";
import AddSubjectModal from "./AddSubjectModal";
import EditSubjectModal from "./EditSubjectModal";
import { useToastMessage } from "@/hooks/use-toast-message";

type Subject = {
  id: number;
  subject_code?: string;
  name?: string;
  subject_name?: string;
  credits?: number;
  faculty_id?: number;
  faculty_name?: string;
  department_id?: number;
  department_name?: string;
  faculty?: {
    id?: number;
    name?: string;
  };
};

type FacultyOption = {
  id: number;
  name?: string;
};

type SubjectForm = {
  subject_code: string;
  name: string;
  credits: number;
  faculty_id: number;
};

const initialForm: SubjectForm = {
  subject_code: "",
  name: "",
  credits: 0,
  faculty_id: 0,
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<SubjectForm>(initialForm);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);

  useToastMessage(message, messageType);

  const fetchSubjects = useCallback(async (options?: { preserveFeedback?: boolean }) => {
    try {
      setLoading(true);
      if (!options?.preserveFeedback) {
        setMessage("");
        setMessageType("");
      }

      const [subjectsRes, facultiesRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/faculties"),
      ]);

      const subjectList = Array.isArray(subjectsRes.data)
        ? subjectsRes.data
        : Array.isArray(subjectsRes.data.data)
          ? subjectsRes.data.data
          : [];

      const facultyList = Array.isArray(facultiesRes.data)
        ? facultiesRes.data
        : Array.isArray(facultiesRes.data.data)
          ? facultiesRes.data.data
          : [];

      const normalizedFaculties = facultyList as FacultyOption[];
      const facultyNameMap = new Map(
        normalizedFaculties.map((faculty) => [Number(faculty.id), faculty.name || ""])
      );

      setFaculties(normalizedFaculties);
      setSubjects(
        (subjectList as Subject[]).map((subject) => {
          const resolvedFacultyId =
            Number(subject.faculty_id) ||
            Number(subject.department_id) ||
            Number(subject.faculty?.id) ||
            0;

          const resolvedFacultyName =
            subject.faculty_name ||
            subject.department_name ||
            subject.faculty?.name ||
            facultyNameMap.get(resolvedFacultyId) ||
            "";

          return {
            ...subject,
            name: subject.name ?? subject.subject_name ?? "",
            faculty_id: resolvedFacultyId || undefined,
            faculty_name: resolvedFacultyName,
          };
        })
      );
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong tai duoc danh sach mon hoc");
      } else {
        setMessage("Khong tai duoc danh sach mon hoc");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const filteredSubjects = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();

    return subjects.filter((subject) => {
      const code = subject.subject_code?.toLowerCase() || "";
      const name = subject.name?.toLowerCase() || "";
      const facultyName = subject.faculty_name?.toLowerCase() || "";
      const matchesKeyword =
        code.includes(lowerKeyword) ||
        name.includes(lowerKeyword) ||
        facultyName.includes(lowerKeyword);
      const matchesFaculty =
        !selectedFacultyId || Number(subject.faculty_id) === Number(selectedFacultyId);

      return matchesKeyword && matchesFaculty;
    });
  }, [keyword, selectedFacultyId, subjects]);

  const handleInputChange = (field: keyof SubjectForm, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingSubjectId(null);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const openAddPopup = () => {
    resetForm();
    setOpenAddModal(true);
  };

  const openEditPopup = (subject: Subject) => {
    setEditingSubjectId(subject.id);
      setFormData({
        subject_code: subject.subject_code || "",
        name: subject.name || subject.subject_name || "",
        credits: subject.credits ?? 0,
        faculty_id:
          Number(subject.faculty_id) ||
          Number(subject.department_id) ||
          Number(subject.faculty?.id) ||
          0,
      });
    setOpenEditModal(true);
  };

  const buildPayload = () => ({
    subject_code: formData.subject_code,
    name: formData.name,
    subject_name: formData.name,
    credits: Number(formData.credits),
    faculty_id: Number(formData.faculty_id),
  });

  const validateForm = () => {
    if (!formData.subject_code.trim() || !formData.name.trim() || !formData.faculty_id) {
      setMessage("Vui long nhap ma mon, ten mon va chon khoa");
      setMessageType("error");
      return false;
    }
    return true;
  };

  const handleAddSubject = async () => {
    if (submitting || !validateForm()) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      await api.post("/subjects", buildPayload());

      closeAllModals();
      await fetchSubjects({ preserveFeedback: true });
      setMessage("Them mon hoc thanh cong");
      setMessageType("success");
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Them mon hoc that bai");
      } else {
        setMessage("Them mon hoc that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubject = async () => {
    if (!editingSubjectId || submitting || !validateForm()) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      await api.put(`/subjects/${editingSubjectId}`, buildPayload());

      closeAllModals();
      await fetchSubjects({ preserveFeedback: true });
      setMessage("Cap nhat mon hoc thanh cong");
      setMessageType("success");
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Cap nhat mon hoc that bai");
      } else {
        setMessage("Cap nhat mon hoc that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Ban co chac muon xoa mon hoc nay khong?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/subjects/${id}`);
      await fetchSubjects({ preserveFeedback: true });
      setMessage("Xoa mon hoc thanh cong");
      setMessageType("success");
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xoa mon hoc that bai");
      } else {
        setMessage("Xoa mon hoc that bai");
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-emerald-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <BookOpen size={24} />
                </div>
                Quan ly mon hoc
              </h1>
              <p className="mt-3 text-sm text-white/85">
                Theo doi, tim kiem va quan ly danh sach mon hoc trong he thong.
              </p>
            </div>

            <button
              onClick={openAddPopup}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-600 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={16} />
              Them mon hoc
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-3 md:max-w-3xl md:flex-row">
              <div className="relative w-full md:max-w-md">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Tim theo ma mon, ten mon hoac khoa..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <select
                value={selectedFacultyId || ""}
                onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Tat ca khoa</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name || `Khoa ${faculty.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-slate-500">
              Tong: <span className="font-semibold text-slate-700">{filteredSubjects.length}</span>{" "}
              mon hoc
            </div>
          </div>

          {message && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="h-3 w-64 rounded bg-slate-100" />
                    </div>
                    <div className="h-9 w-24 rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4 font-semibold">Mon hoc</th>
                      <th className="px-5 py-4 font-semibold">So tin chi</th>
                      <th className="px-5 py-4 font-semibold">Khoa</th>
                      <th className="px-5 py-4 font-semibold">ID</th>
                      <th className="px-5 py-4 text-center font-semibold">Hanh dong</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map((subject) => (
                        <tr
                          key={subject.id}
                          className="border-t border-slate-100 text-sm text-slate-700 transition odd:bg-white even:bg-slate-50/50 hover:bg-emerald-50/50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-bold text-white shadow-sm">
                                <GraduationCap size={18} />
                              </div>

                              <div>
                                <div className="font-semibold text-slate-800">
                                  {subject.name || "-"}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {subject.subject_code || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Hash size={14} className="text-slate-400" />
                              <span>{subject.credits ?? "-"}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Building2 size={14} className="text-slate-400" />
                              <span>{subject.faculty_name || "-"}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-600">#{subject.id}</td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditPopup(subject)}
                                className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 transition hover:bg-emerald-100"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(subject.id)}
                                className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="rounded-full bg-slate-100 p-4">
                              <BookOpen size={24} className="text-slate-400" />
                            </div>
                            <div className="font-medium text-slate-600">
                              Khong co du lieu mon hoc
                            </div>
                            <div className="text-slate-400">
                              Hay thu tim kiem voi tu khoa khac.
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddSubjectModal
        open={openAddModal}
        submitting={submitting}
        formData={formData}
        faculties={faculties}
        onClose={closeAllModals}
        onChange={handleInputChange}
        onSubmit={handleAddSubject}
      />

      <EditSubjectModal
        open={openEditModal}
        submitting={submitting}
        formData={formData}
        faculties={faculties}
        onClose={closeAllModals}
        onChange={handleInputChange}
        onSubmit={handleEditSubject}
      />
    </>
  );
}
