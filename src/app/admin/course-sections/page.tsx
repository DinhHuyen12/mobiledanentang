"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { BookCopy, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type CourseSectionItem = { id: number; subject?: string; lecturer_id?: number; semester?: string; max_students?: number };
type SubjectOption = { id: number; name?: string; subject_name?: string };
type LecturerOption = { id: number; full_name?: string; lecturer_code?: string };
type SemesterOption = { id: number; name?: string };
type CourseSectionForm = { subject_id: number; lecturer_id: number; semester_id: number; max_students: number };

const initialForm: CourseSectionForm = { subject_id: 0, lecturer_id: 0, semester_id: 0, max_students: 30 };

function getCollection(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "data" in payload && Array.isArray((payload as { data?: unknown }).data)) return (payload as { data: unknown[] }).data;
  return [];
}

function getUniqueByKey<T>(items: T[], getKey: (item: T, index: number) => string) {
  const seen = new Set<string>();

  return items.filter((item, index) => {
    const key = getKey(item, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function CourseSectionModal({ title, open, submitting, subjects, lecturers, semesters, formData, onChange, onClose, onSubmit }: { title: string; open: boolean; submitting: boolean; subjects: SubjectOption[]; lecturers: LecturerOption[]; semesters: SemesterOption[]; formData: CourseSectionForm; onChange: (field: keyof CourseSectionForm, value: number) => void; onClose: () => void; onSubmit: () => void }) {
  if (!open) return null;

  const uniqueSubjects = getUniqueByKey(
    subjects,
    (item, index) => [item.id, item.name || item.subject_name || "", index].join("|")
  );
  const uniqueLecturers = getUniqueByKey(
    lecturers,
    (item, index) => [item.id, item.full_name || item.lecturer_code || "", index].join("|")
  );
  const uniqueSemesters = getUniqueByKey(
    semesters,
    (item, index) => [item.id, item.name || "", index].join("|")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div><h2 className="text-xl font-bold text-slate-800">{title}</h2><p className="text-sm text-slate-500">Nhap thong tin lop hoc phan</p></div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div><label className="text-sm font-medium">Mon hoc</label><select value={formData.subject_id || ""} onChange={(e) => onChange("subject_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon mon hoc</option>{uniqueSubjects.map((item, index) => <option key={[item.id, item.name || item.subject_name || "", index].join("-")} value={item.id}>{item.name || item.subject_name || `Subject ${item.id}`}</option>)}</select></div>
          <div><label className="text-sm font-medium">Giang vien</label><select value={formData.lecturer_id || ""} onChange={(e) => onChange("lecturer_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon giang vien</option>{uniqueLecturers.map((item, index) => <option key={[item.id, item.full_name || item.lecturer_code || "", index].join("-")} value={item.id}>{item.full_name || item.lecturer_code || `Lecturer ${item.id}`}</option>)}</select></div>
          <div><label className="text-sm font-medium">Hoc ky</label><select value={formData.semester_id || ""} onChange={(e) => onChange("semester_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon hoc ky</option>{uniqueSemesters.map((item, index) => <option key={[item.id, item.name || "", index].join("-")} value={item.id}>{item.name || `Semester ${item.id}`}</option>)}</select></div>
          <div><label className="text-sm font-medium">Si so toi da</label><input type="number" min={1} value={formData.max_students} onChange={(e) => onChange("max_students", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4"><button onClick={onClose} className="rounded-xl border px-4 py-2">Huy</button><button onClick={onSubmit} disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-white">{submitting ? "Dang luu..." : "Luu"}</button></div>
      </div>
    </div>
  );
}

export default function CourseSectionsPage() {
  const [items, setItems] = useState<CourseSectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CourseSectionForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchItems = useCallback(async () => {
    try { setLoading(true); setMessage(""); setMessageType(""); const res = await api.get("/course-sections"); setItems(getCollection(res.data)); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Khong tai duoc lop hoc phan" : "Khong tai duoc lop hoc phan"); }
    finally { setLoading(false); }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [subjectsRes, lecturersRes, semestersRes] = await Promise.all([api.get("/subjects"), api.get("/lecturer-info"), api.get("/semesters")]);
      setSubjects(getCollection(subjectsRes.data));
      setLecturers(getCollection(lecturersRes.data));
      setSemesters(getCollection(semestersRes.data));
    } catch {}
  }, []);

  useEffect(() => { fetchItems(); fetchLookups(); }, [fetchItems, fetchLookups]);

  const filteredItems = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return getUniqueByKey(
      items.filter((item) => String(item.subject || "").toLowerCase().includes(lowerKeyword) || String(item.semester || "").toLowerCase().includes(lowerKeyword) || String(item.lecturer_id || "").includes(lowerKeyword)),
      (item, index) =>
        [
          item.id,
          item.subject || "",
          item.semester || "",
          item.lecturer_id || "",
          item.max_students || "",
          index,
        ].join("|")
    );
  }, [items, keyword]);

  const resetForm = () => { setFormData(initialForm); setEditingId(null); };
  const closeAllModals = () => { setOpenAddModal(false); setOpenEditModal(false); resetForm(); };

  const validateForm = () => {
    if (!formData.subject_id || !formData.lecturer_id || !formData.semester_id || !formData.max_students) { setMessageType("error"); setMessage("Vui long nhap day du thong tin lop hoc phan"); return false; }
    return true;
  };

  const submitForm = async (mode: "add" | "edit") => {
    if (submitting || !validateForm()) return;
    if (mode === "edit" && !editingId) return;
    try {
      setSubmitting(true); setMessage(""); setMessageType("");
      const payload = { subject_id: Number(formData.subject_id), lecturer_id: Number(formData.lecturer_id), semester_id: Number(formData.semester_id), max_students: Number(formData.max_students) };
      if (mode === "add") { await api.post("/course-sections", payload); toast.success("Them lop hoc phan thanh cong"); setMessage("Them lop hoc phan thanh cong"); } else { await api.put(`/course-sections/${editingId}`, payload); toast.success("Cap nhat lop hoc phan thanh cong"); setMessage("Cap nhat lop hoc phan thanh cong"); }
      setMessageType("success"); closeAllModals(); fetchItems();
    } catch (error: unknown) {
      setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Luu lop hoc phan that bai" : "Luu lop hoc phan that bai");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa lop hoc phan nay khong?")) return;
    try { await api.delete(`/course-sections/${id}`); toast.success("Xoa lop hoc phan thanh cong"); setMessage("Xoa lop hoc phan thanh cong"); setMessageType("success"); fetchItems(); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Xoa lop hoc phan that bai" : "Xoa lop hoc phan that bai"); }
  };

  const openEdit = (item: CourseSectionItem) => {
    setEditingId(item.id);
    setFormData({ subject_id: 0, lecturer_id: item.lecturer_id ?? 0, semester_id: 0, max_students: item.max_students ?? 30 });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 p-6 text-white shadow-lg shadow-indigo-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><div className="rounded-2xl bg-white/20 p-2 backdrop-blur"><BookCopy size={24} /></div>Course Sections</h1><p className="mt-3 text-sm text-white/85">Quan ly cac lop hoc phan theo mon hoc, giang vien va hoc ky.</p></div>
            <button onClick={() => { resetForm(); setOpenAddModal(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"><Plus size={16} />Them lop hoc phan</button>
          </div>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tim theo mon hoc, hoc ky..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></div>
            <div className="text-sm text-slate-500">Tong: <span className="font-semibold text-slate-700">{filteredItems.length}</span> lop hoc phan</div>
          </div>
          {message && <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
          <div className="overflow-hidden rounded-2xl border border-slate-100"><div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-5 py-4 font-semibold">Mon hoc</th><th className="px-5 py-4 font-semibold">Hoc ky</th><th className="px-5 py-4 font-semibold">Lecturer ID</th><th className="px-5 py-4 font-semibold">Max</th><th className="px-5 py-4 text-center font-semibold">Hanh dong</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">Dang tai du lieu...</td></tr> : filteredItems.length > 0 ? filteredItems.map((item, index) => <tr key={[item.id, item.subject || "", item.semester || "", item.lecturer_id || "", item.max_students || "", index].join("-")} className="border-t border-slate-100 text-sm text-slate-700 odd:bg-white even:bg-slate-50/50"><td className="px-5 py-4 font-semibold text-slate-800">{item.subject || "-"}</td><td className="px-5 py-4">{item.semester || "-"}</td><td className="px-5 py-4">#{item.lecturer_id || "-"}</td><td className="px-5 py-4">{item.max_students ?? "-"}</td><td className="px-5 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(item)} className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700 transition hover:bg-indigo-100"><Pencil size={16} /></button><button onClick={() => handleDelete(item.id)} className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">Khong co du lieu lop hoc phan</td></tr>}</tbody></table></div></div>
        </div>
      </div>
      <CourseSectionModal title="Them lop hoc phan" open={openAddModal} submitting={submitting} subjects={subjects} lecturers={lecturers} semesters={semesters} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("add")} />
      <CourseSectionModal title="Cap nhat lop hoc phan" open={openEditModal} submitting={submitting} subjects={subjects} lecturers={lecturers} semesters={semesters} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("edit")} />
    </>
  );
}
