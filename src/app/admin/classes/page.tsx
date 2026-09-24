"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import {
  Building2,
  CalendarRange,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import AddClassModal from "./AddClassModal";
import EditClassModal from "./EditClassModal";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type LookupOption = {
  id: number;
  name: string;
};

type ClassItem = {
  id: number;
  name?: string;
  faculty_id?: number;
  faculty_name?: string;
  academic_year_id?: number;
  academic_year_name?: string;
};

type ClassForm = {
  name: string;
  faculty_id: number;
  academic_year_id: number;
};

const initialForm: ClassForm = {
  name: "",
  faculty_id: 0,
  academic_year_id: 0,
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faculties, setFaculties] = useState<LookupOption[]>([]);
  const [academicYears, setAcademicYears] = useState<LookupOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClassForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchLookups = useCallback(async () => {
    try {
      const [facultiesRes, yearsRes] = await Promise.all([
        api.get("/faculties"),
        api.get("/academic-years"),
      ]);

      const facultiesData = Array.isArray(facultiesRes.data)
        ? facultiesRes.data
        : Array.isArray(facultiesRes.data.data)
          ? facultiesRes.data.data
          : [];

      const yearsData = Array.isArray(yearsRes.data)
        ? yearsRes.data
        : Array.isArray(yearsRes.data.data)
          ? yearsRes.data.data
          : [];

      setFaculties(facultiesData);
      setAcademicYears(yearsData);
    } catch {}
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const res = await api.get("/classes");
      const classList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];

      setClasses(classList);
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong tai duoc danh sach lop");
      } else {
        setMessage("Khong tai duoc danh sach lop");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.allSettled([fetchClasses(), fetchLookups()]);
    };

    loadData();
  }, [fetchClasses, fetchLookups]);

  const filteredClasses = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();

    return classes.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const faculty = item.faculty_name?.toLowerCase() || "";
      const year = item.academic_year_name?.toLowerCase() || "";

      return (
        name.includes(lowerKeyword) ||
        faculty.includes(lowerKeyword) ||
        year.includes(lowerKeyword)
      );
    });
  }, [classes, keyword]);

  const handleInputChange = (
    field: keyof ClassForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingClassId(null);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const openEditPopup = (item: ClassItem) => {
    setEditingClassId(item.id);
    setFormData({
      name: item.name || "",
      faculty_id: item.faculty_id ?? 0,
      academic_year_id: item.academic_year_id ?? 0,
    });
    setOpenEditModal(true);
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.faculty_id || !formData.academic_year_id) {
      setMessageType("error");
      setMessage("Vui long nhap ten lop, khoa va nam hoc");
      return false;
    }

    return true;
  };

  const handleAddClass = async () => {
    if (submitting || !validateForm()) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      await api.post("/classes", {
        name: formData.name.trim(),
        faculty_id: Number(formData.faculty_id),
        academic_year_id: Number(formData.academic_year_id),
      });

      toast.success("Them lop thanh cong");
      setMessage("Them lop thanh cong");
      setMessageType("success");
      closeAllModals();
      fetchClasses();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Them lop that bai");
      } else {
        setMessage("Them lop that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClass = async () => {
    if (!editingClassId || submitting || !validateForm()) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      await api.put(`/classes/${editingClassId}`, {
        name: formData.name.trim(),
        faculty_id: Number(formData.faculty_id),
        academic_year_id: Number(formData.academic_year_id),
      });

      toast.success("Cap nhat lop thanh cong");
      setMessage("Cap nhat lop thanh cong");
      setMessageType("success");
      closeAllModals();
      fetchClasses();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Cap nhat lop that bai");
      } else {
        setMessage("Cap nhat lop that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Ban co chac muon xoa lop nay khong?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/classes/${id}`);
      toast.success("Xoa lop thanh cong");
      setMessage("Xoa lop thanh cong");
      setMessageType("success");
      fetchClasses();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xoa lop that bai");
      } else {
        setMessage("Xoa lop that bai");
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 p-6 text-white shadow-lg shadow-cyan-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <Layers size={24} />
                </div>
                Quản lý lớp
              </h1>
              <p className="mt-3 text-sm text-white/85">
                Theo dõi, tạo mới và cập nhật lớp học theo khóa và năm học.
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setOpenAddModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-cyan-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={16} />
              Thêm lớp
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Tim theo ten lop, khoa hoac nam hoc..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>

            <div className="text-sm text-slate-500">
              Tổng:{" "}
              <span className="font-semibold text-slate-700">
                {filteredClasses.length}
              </span>{" "}
              lớp
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
                      <th className="px-5 py-4 font-semibold">Lop</th>
                      <th className="px-5 py-4 font-semibold">Khoa</th>
                      <th className="px-5 py-4 font-semibold">Nam hoc</th>
                      <th className="px-5 py-4 font-semibold">ID</th>
                      <th className="px-5 py-4 text-center font-semibold">Hanh dong</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredClasses.length > 0 ? (
                      filteredClasses.map((item) => (
                        <tr
                          key={item.id}
                          className="border-t border-slate-100 text-sm text-slate-700 transition odd:bg-white even:bg-slate-50/50 hover:bg-cyan-50/60"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-sm font-bold text-white shadow-sm">
                                <GraduationCap size={18} />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {item.name || "-"}
                                </div>
                                <div className="text-sm text-slate-500">
                                  Lop #{item.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Building2 size={14} className="text-slate-400" />
                              <span>{item.faculty_name || item.faculty_id || "-"}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-slate-700">
                              <CalendarRange size={14} className="text-slate-400" />
                              <span>
                                {item.academic_year_name || item.academic_year_id || "-"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-600">
                            #{item.id}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditPopup(item)}
                                className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700 transition hover:bg-cyan-100"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(item.id)}
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
                              <Layers size={24} className="text-slate-400" />
                            </div>
                            <div className="font-medium text-slate-600">
                              Khong co du lieu lop
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

      <AddClassModal
        open={openAddModal}
        submitting={submitting}
        faculties={faculties}
        academicYears={academicYears}
        formData={formData}
        onClose={closeAllModals}
        onChange={handleInputChange}
        onSubmit={handleAddClass}
      />

      <EditClassModal
        open={openEditModal}
        submitting={submitting}
        faculties={faculties}
        academicYears={academicYears}
        formData={formData}
        onClose={closeAllModals}
        onChange={handleInputChange}
        onSubmit={handleEditClass}
      />
    </>
  );
}
