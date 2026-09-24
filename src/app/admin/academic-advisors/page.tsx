"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { CalendarDays, Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";
import { getCollection } from "@/lib/student-portal";

type AdvisorItem = {
  id: number;
  lecturer_id?: number;
  lecturer_name?: string;
  class_id?: number;
  class_name?: string;
  student_id?: number;
  student_name?: string;
  start_date?: string;
  end_date?: string;
  note?: string;
  status?: string;
};

type LecturerOption = { id: number; full_name?: string; lecturer_code?: string };
type ClassOption = { id: number; name?: string };
type StudentOption = { id: number; full_name?: string; username?: string };

type AdvisorForm = {
  lecturer_id: number;
  class_id: number;
  student_id: number;
  start_date: string;
  end_date: string;
  note: string;
  status: string;
};

const initialForm: AdvisorForm = {
  lecturer_id: 0,
  class_id: 0,
  student_id: 0,
  start_date: "",
  end_date: "",
  note: "",
  status: "active",
};

function AdvisorModal({
  open,
  title,
  submitting,
  lecturers,
  classes,
  students,
  formData,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitting: boolean;
  lecturers: LecturerOption[];
  classes: ClassOption[];
  students: StudentOption[];
  formData: AdvisorForm;
  onChange: (field: keyof AdvisorForm, value: string | number) => void;
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
            <p className="text-sm text-slate-500">Phân công cố vấn theo lớp hoặc sinh viên</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Giảng viên</label>
            <select
              value={formData.lecturer_id || ""}
              onChange={(e) => onChange("lecturer_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Chọn giảng viên</option>
              {lecturers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name || item.lecturer_code || `Lecturer ${item.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Lớp</label>
            <select
              value={formData.class_id || ""}
              onChange={(e) => onChange("class_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Chọn lớp</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || `Class ${item.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Sinh viên riêng</label>
            <select
              value={formData.student_id || ""}
              onChange={(e) => onChange("student_id", Number(e.target.value))}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Không gán riêng sinh viên</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name || item.username || `Student ${item.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Ngày bắt đầu</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => onChange("start_date", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Ngày kết thúc</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => onChange("end_date", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) => onChange("status", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
              <option value="completed">Hoàn tất</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Ghi chú</label>
            <textarea
              value={formData.note}
              onChange={(e) => onChange("note", e.target.value)}
              className="mt-1 min-h-24 w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white disabled:bg-indigo-300"
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AcademicAdvisorsPage() {
  const [items, setItems] = useState<AdvisorItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AdvisorForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, lecturersRes, classesRes, studentsRes] = await Promise.all([
        api.get("/academic-advisors"),
        api.get("/lecturer-info"),
        api.get("/classes"),
        api.get("/student-info"),
      ]);
      setItems(getCollection(itemsRes.data) as AdvisorItem[]);
      setLecturers(getCollection(lecturersRes.data) as LecturerOption[]);
      setClasses(getCollection(classesRes.data) as ClassOption[]);
      setStudents(getCollection(studentsRes.data) as StudentOption[]);
      setMessage("");
      setMessageType("");
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Không tải được cố vấn học tập");
      } else {
        setMessage("Không tải được cố vấn học tập");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    const lower = keyword.toLowerCase();
    return items.filter((item) =>
      [item.lecturer_name, item.class_name, item.student_name, item.status, item.note]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(lower))
    );
  }, [items, keyword]);

  const closeModal = () => {
    setOpenModal(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  const submitForm = async () => {
    if (!formData.lecturer_id || !formData.start_date || !formData.status) {
      setMessageType("error");
      setMessage("Vui lòng nhập giảng viên, ngày bắt đầu và trạng thái");
      return;
    }
    if (!formData.class_id && !formData.student_id) {
      setMessageType("error");
      setMessage("Cần chọn ít nhất lớp hoặc sinh viên");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        lecturer_id: formData.lecturer_id,
        class_id: formData.class_id || null,
        student_id: formData.student_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        note: formData.note.trim(),
        status: formData.status,
      };
      if (editingId) {
        await api.put(`/academic-advisors/${editingId}`, payload);
        toast.success("Cập nhật cố vấn học tập thành công");
      } else {
        await api.post("/academic-advisors", payload);
        toast.success("Tạo cố vấn học tập thành công");
      }
      closeModal();
      fetchData();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Lưu cố vấn học tập thất bại");
      } else {
        toast.error("Lưu cố vấn học tập thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: AdvisorItem) => {
    setEditingId(item.id);
    setFormData({
      lecturer_id: Number(item.lecturer_id || 0),
      class_id: Number(item.class_id || 0),
      student_id: Number(item.student_id || 0),
      start_date: item.start_date ? String(item.start_date).slice(0, 10) : "",
      end_date: item.end_date ? String(item.end_date).slice(0, 10) : "",
      note: item.note || "",
      status: item.status || "active",
    });
    setOpenModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa phân công này không?")) return;
    try {
      await api.delete(`/academic-advisors/${id}`);
      toast.success("Xóa phân công thành công");
      fetchData();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Xóa phân công thất bại");
      } else {
        toast.error("Xóa phân công thất bại");
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Cố vấn học tập</h1>
              <p className="mt-3 text-sm text-white/85">
                Quản lý phân công cố vấn theo lớp hoặc sinh viên.
              </p>
            </div>
            <button
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700"
            >
              <Plus size={16} />
              Thêm phân công
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo giảng viên, lớp, sinh viên..."
                className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4"
              />
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Tổng phân công: <span className="font-semibold text-slate-800">{items.length}</span>
            </div>
          </div>

          {message ? (
            <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {message}
            </div>
          ) : null}

          <div className="space-y-3">
            {loading ? (
              <div className="text-sm text-slate-500">Đang tải dữ liệu...</div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.lecturer_name || "-"}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1"><UserRound size={14} /> Lớp: {item.class_name || "-"}</span>
                        <span>Sinh viên: {item.student_name || "Theo lớp"}</span>
                        <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {item.start_date ? String(item.start_date).slice(0,10) : "-"} - {item.end_date ? String(item.end_date).slice(0,10) : "..."}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{item.note || "Không có ghi chú."}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{item.status || "-"}</span>
                      <button onClick={() => openEdit(item)} className="rounded-xl bg-amber-50 p-2 text-amber-700"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="rounded-xl bg-rose-50 p-2 text-rose-700"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Không có phân công phù hợp.
              </div>
            )}
          </div>
        </div>
      </div>

      <AdvisorModal
        open={openModal}
        title={editingId ? "Cập nhật cố vấn học tập" : "Thêm cố vấn học tập"}
        submitting={submitting}
        lecturers={lecturers}
        classes={classes}
        students={students}
        formData={formData}
        onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        onClose={closeModal}
        onSubmit={submitForm}
      />
    </>
  );
}
