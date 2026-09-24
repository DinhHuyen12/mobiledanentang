"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import {
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type UserOption = {
  id: number;
  username?: string;
  full_name?: string;
  email?: string;
};

type ClassOption = {
  id: number;
  name?: string;
};

type StudentInfo = {
  id: number;
  user_id?: number;
  username?: string;
  email?: string;
  full_name?: string;
  class_id?: number;
  class_name?: string;
  enrollment_date?: string;
  status?: string;
};

type StudentForm = {
  user_id: number;
  class_id: number;
  enrollment_date: string;
  status: string;
};

const initialForm: StudentForm = {
  user_id: 0,
  class_id: 0,
  enrollment_date: "",
  status: "",
};

function StudentModal({
  title,
  open,
  submitting,
  users,
  classes,
  formData,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  open: boolean;
  submitting: boolean;
  users: UserOption[];
  classes: ClassOption[];
  formData: StudentForm;
  onChange: (field: keyof StudentForm, value: string | number) => void;
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
            <p className="text-sm text-slate-500">Nhap thong tin sinh vien</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Nguoi dung</label>
            <select
              value={formData.user_id || ""}
              onChange={(e) => onChange("user_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Chon user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.username || `User ${user.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Lop</label>
            <select
              value={formData.class_id || ""}
              onChange={(e) => onChange("class_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Chon lop</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name || `Class ${classItem.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Ngay nhap hoc</label>
            <input
              type="date"
              value={formData.enrollment_date}
              onChange={(e) => onChange("enrollment_date", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Trang thai</label>
            <input
              value={formData.status}
              onChange={(e) => onChange("status", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="Vi du: dang hoc"
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
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white"
          >
            {submitting ? "Dang luu..." : "Luu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<StudentForm>(initialForm);

  const handleImportStudents = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || importing) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/student-info/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(response.data?.message || "Import sinh viên thành công");
      setMessage(response.data?.message || "Import sinh viên thành công");
      setMessageType("success");
      await fetchStudents();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Import sinh viên thất bại");
      } else {
        setMessage("Import sinh viên thất bại");
      }
    } finally {
      setImporting(false);
    }
  };

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

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");
      const res = await api.get("/student-info");
      setStudents(getCollection(res.data));
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong tai duoc danh sach sinh vien");
      } else {
        setMessage("Khong tai duoc danh sach sinh vien");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [usersRes, classesRes] = await Promise.all([api.get("/users"), api.get("/classes")]);
      setUsers(getCollection(usersRes.data));
      setClasses(getCollection(classesRes.data));
    } catch {}
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchLookups();
  }, [fetchStudents, fetchLookups]);

  const filteredStudents = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return students.filter((student) => {
      const fullName = (student.full_name || "").toLowerCase();
      const username = (student.username || "").toLowerCase();
      const email = (student.email || "").toLowerCase();
      const className = (student.class_name || "").toLowerCase();
      const status = (student.status || "").toLowerCase();
      return (
        fullName.includes(lowerKeyword) ||
        username.includes(lowerKeyword) ||
        email.includes(lowerKeyword) ||
        className.includes(lowerKeyword) ||
        status.includes(lowerKeyword)
      );
    });
  }, [keyword, students]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const handleInputChange = (field: keyof StudentForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.user_id || !formData.class_id || !formData.enrollment_date || !formData.status.trim()) {
      setMessageType("error");
      setMessage("Vui long nhap day du thong tin sinh vien");
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
        user_id: Number(formData.user_id),
        class_id: Number(formData.class_id),
        enrollment_date: formData.enrollment_date,
        status: formData.status.trim(),
      };

      if (mode === "add") {
        await api.post("/student-info", payload);
        toast.success("Them sinh vien thanh cong");
        setMessage("Them sinh vien thanh cong");
      } else {
        await api.put(`/student-info/${editingId}`, payload);
        toast.success("Cap nhat sinh vien thanh cong");
        setMessage("Cap nhat sinh vien thanh cong");
      }

      setMessageType("success");
      closeAllModals();
      fetchStudents();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            (mode === "add" ? "Them sinh vien that bai" : "Cap nhat sinh vien that bai")
        );
      } else {
        setMessage(mode === "add" ? "Them sinh vien that bai" : "Cap nhat sinh vien that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa sinh vien nay khong?")) return;
    try {
      await api.delete(`/student-info/${id}`);
      toast.success("Xoa sinh vien thanh cong");
      setMessage("Xoa sinh vien thanh cong");
      setMessageType("success");
      fetchStudents();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xoa sinh vien that bai");
      } else {
        setMessage("Xoa sinh vien that bai");
      }
    }
  };

  const openEdit = (student: StudentInfo) => {
    setEditingId(student.id);
    setFormData({
      user_id: student.user_id ?? 0,
      class_id: student.class_id ?? 0,
      enrollment_date: student.enrollment_date ? String(student.enrollment_date).slice(0, 10) : "",
      status: student.status || "",
    });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 p-6 text-white shadow-lg shadow-sky-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <GraduationCap size={24} />
                </div>
                Quan ly sinh vien
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/85">
                Theo doi thong tin sinh vien, lop hoc va trang thai nhap hoc.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:-translate-y-0.5">
                <Upload size={18} />
                {importing ? "Dang import..." : "Import Excel"}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) => void handleImportStudents(event)}
                  className="hidden"
                  disabled={importing}
                />
              </label>

              <button
                onClick={() => {
                  resetForm();
                  setOpenAddModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-lg transition hover:-translate-y-0.5"
              >
                <Plus size={18} />
                Them sinh vien
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
                placeholder="Tim theo ten, lop hoac trang thai..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Tong sinh vien: <span className="font-semibold text-slate-800">{students.length}</span>
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
                    <th className="px-6 py-4">Lop</th>
                    <th className="px-6 py-4">Ngay nhap hoc</th>
                    <th className="px-6 py-4">Trang thai</th>
                    <th className="px-6 py-4 text-right">Thao tac</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        Dang tai du lieu...
                      </td>
                    </tr>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
                              <UserRound size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {student.full_name || student.username || `Student ${student.id}`}
                              </p>
                              <p className="text-sm text-slate-500">{student.email || "Khong co email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{student.class_name || `ID ${student.class_id}`}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {student.enrollment_date ? String(student.enrollment_date).slice(0, 10) : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {student.status || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(student)}
                              className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
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
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                        Khong co sinh vien phu hop
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <StudentModal
        title="Them sinh vien"
        open={openAddModal}
        submitting={submitting}
        users={users}
        classes={classes}
        formData={formData}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={() => submitForm("add")}
      />

      <StudentModal
        title="Cap nhat sinh vien"
        open={openEditModal}
        submitting={submitting}
        users={users}
        classes={classes}
        formData={formData}
        onChange={handleInputChange}
        onClose={closeAllModals}
        onSubmit={() => submitForm("edit")}
      />
    </>
  );
}
