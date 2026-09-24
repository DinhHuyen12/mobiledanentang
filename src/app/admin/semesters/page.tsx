"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import {
  CalendarRange,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type AcademicYear = {
  id: number;
  name: string;
};

type Semester = {
  id: number;
  name?: string;
  academic_year_id?: number;
  academic_year_name?: string;
};

type SemesterForm = {
  name: string;
  academic_year_id: number;
};

const initialForm: SemesterForm = {
  name: "",
  academic_year_id: 0,
};

function SemesterModal({
  title,
  open,
  submitting,
  formData,
  academicYears,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  open: boolean;
  submitting: boolean;
  formData: SemesterForm;
  academicYears: AcademicYear[];
  onChange: (field: keyof SemesterForm, value: string | number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">Nhap thong tin hoc ky</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-4 p-6">
          <div>
            <label className="text-sm font-medium">Ten hoc ky</label>
            <div className="relative mt-1">
              <CalendarRange className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="w-full rounded-xl border py-2 pl-10 pr-3"
                placeholder="Nhap ten hoc ky"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Nam hoc</label>
            <div className="relative mt-1">
              <CalendarRange className="absolute left-3 top-3 text-slate-400" size={16} />
              {academicYears.length > 0 ? (
                <select
                  value={formData.academic_year_id || ""}
                  onChange={(e) => onChange("academic_year_id", Number(e.target.value))}
                  className="w-full rounded-xl border py-2 pl-10 pr-3"
                >
                  <option value="">Chon nam hoc</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={formData.academic_year_id || ""}
                  onChange={(e) => onChange("academic_year_id", Number(e.target.value))}
                  className="w-full rounded-xl border py-2 pl-10 pr-3"
                  placeholder="Nhap academic_year_id"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Huy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
          >
            {submitting ? "Dang luu..." : "Luu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SemesterForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const res = await api.get("/semesters");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];

      setSemesters(data);
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong tai duoc danh sach hoc ky");
      } else {
        setMessage("Khong tai duoc danh sach hoc ky");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await api.get("/academic-years");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];

      setAcademicYears(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSemesters();
    fetchAcademicYears();
  }, [fetchAcademicYears, fetchSemesters]);

  const filteredSemesters = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();

    return semesters.filter((semester) => {
      const name = (semester.name || "").toLowerCase();
      const year = (semester.academic_year_name || "").toLowerCase();
      return name.includes(lowerKeyword) || year.includes(lowerKeyword);
    });
  }, [keyword, semesters]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof SemesterForm, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.academic_year_id) {
      setMessageType("error");
      setMessage("Vui long nhap ten hoc ky va nam hoc");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (submitting || !validateForm()) return;
    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");
      await api.post("/semesters", {
        name: formData.name.trim(),
        academic_year_id: Number(formData.academic_year_id),
      });
      toast.success("Them hoc ky thanh cong");
      setMessage("Them hoc ky thanh cong");
      setMessageType("success");
      closeAllModals();
      fetchSemesters();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Them hoc ky that bai");
      } else {
        setMessage("Them hoc ky that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId || submitting || !validateForm()) return;
    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");
      await api.put(`/semesters/${editingId}`, {
        name: formData.name.trim(),
        academic_year_id: Number(formData.academic_year_id),
      });
      toast.success("Cap nhat hoc ky thanh cong");
      setMessage("Cap nhat hoc ky thanh cong");
      setMessageType("success");
      closeAllModals();
      fetchSemesters();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Cap nhat hoc ky that bai");
      } else {
        setMessage("Cap nhat hoc ky that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa hoc ky nay khong?")) return;
    try {
      await api.delete(`/semesters/${id}`);
      toast.success("Xoa hoc ky thanh cong");
      setMessage("Xoa hoc ky thanh cong");
      setMessageType("success");
      fetchSemesters();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xoa hoc ky that bai");
      } else {
        setMessage("Xoa hoc ky that bai");
      }
    }
  };

  const openEdit = (semester: Semester) => {
    setEditingId(semester.id);
    setFormData({
      name: semester.name || "",
      academic_year_id: semester.academic_year_id ?? 0,
    });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-lime-500 to-green-500 p-6 text-white shadow-lg shadow-emerald-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <CalendarRange size={24} />
                </div>
                Quan ly hoc ky
              </h1>
              <p className="mt-3 text-sm text-white/85">
                Quan ly hoc ky va lien ket voi nam hoc tuong ung.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setOpenAddModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={16} />
              Them hoc ky
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tim theo ten hoc ky hoac nam hoc..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="text-sm text-slate-500">
              Tong: <span className="font-semibold text-slate-700">{filteredSemesters.length}</span> hoc ky
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
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4 font-semibold">Hoc ky</th>
                      <th className="px-5 py-4 font-semibold">Nam hoc</th>
                      <th className="px-5 py-4 font-semibold">ID</th>
                      <th className="px-5 py-4 text-center font-semibold">Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSemesters.length > 0 ? (
                      filteredSemesters.map((semester) => (
                        <tr
                          key={semester.id}
                          className="border-t border-slate-100 text-sm text-slate-700 transition odd:bg-white even:bg-slate-50/50 hover:bg-emerald-50/60"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-800">{semester.name || "-"}</td>
                          <td className="px-5 py-4">{semester.academic_year_name || semester.academic_year_id || "-"}</td>
                          <td className="px-5 py-4 text-slate-600">#{semester.id}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEdit(semester)}
                                className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(semester.id)}
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
                        <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">
                          Khong co du lieu hoc ky
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

      <SemesterModal
        title="Them hoc ky"
        open={openAddModal}
        submitting={submitting}
        formData={formData}
        academicYears={academicYears}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={handleAdd}
      />
      <SemesterModal
        title="Cap nhat hoc ky"
        open={openEditModal}
        submitting={submitting}
        formData={formData}
        academicYears={academicYears}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={handleEdit}
      />
    </>
  );
}
