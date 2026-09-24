"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { CreditCard, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";
import {
  getApiCollection,
  getTuitionStatusClassName,
  getTuitionStatusLabel,
  sortByLatestDate,
  type TuitionItem,
} from "@/lib/tuition";

type StudentOption = { id: number; full_name?: string; username?: string };
type SemesterOption = { id: number; name?: string };
type TuitionForm = { student_id: number; semester_id: number; total_credits: number; amount: number; paid_amount: number; status: string; due_date: string };

const initialForm: TuitionForm = { student_id: 0, semester_id: 0, total_credits: 0, amount: 0, paid_amount: 0, status: "", due_date: "" };

function TuitionModal({ title, open, submitting, students, semesters, formData, onChange, onClose, onSubmit }: { title: string; open: boolean; submitting: boolean; students: StudentOption[]; semesters: SemesterOption[]; formData: TuitionForm; onChange: (field: keyof TuitionForm, value: string | number) => void; onClose: () => void; onSubmit: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-bold text-slate-800">{title}</h2><p className="text-sm text-slate-500">Nhap thong tin hoc phi</p></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button></div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div><label className="text-sm font-medium">Sinh vien</label><select value={formData.student_id || ""} onChange={(e) => onChange("student_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon sinh vien</option>{students.map((item) => <option key={item.id} value={item.id}>{item.full_name || item.username || `Student ${item.id}`}</option>)}</select></div>
          <div><label className="text-sm font-medium">Hoc ky</label><select value={formData.semester_id || ""} onChange={(e) => onChange("semester_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon hoc ky</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.name || `Semester ${item.id}`}</option>)}</select></div>
          <div><label className="text-sm font-medium">Tong tin chi</label><input type="number" min={0} value={formData.total_credits} onChange={(e) => onChange("total_credits", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">Tong tien</label><input type="number" min={0} value={formData.amount} onChange={(e) => onChange("amount", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">Da dong</label><input type="number" min={0} value={formData.paid_amount} onChange={(e) => onChange("paid_amount", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">Trang thai</label><input value={formData.status} onChange={(e) => onChange("status", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Vi du: unpaid" /></div>
          <div className="md:col-span-2"><label className="text-sm font-medium">Han dong</label><input type="date" value={formData.due_date} onChange={(e) => onChange("due_date", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4"><button onClick={onClose} className="rounded-xl border px-4 py-2">Huy</button><button onClick={onSubmit} disabled={submitting} className="rounded-xl bg-amber-600 px-4 py-2 text-white">{submitting ? "Dang luu..." : "Luu"}</button></div>
      </div>
    </div>
  );
}

export default function TuitionsPage() {
  const [items, setItems] = useState<TuitionItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TuitionForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchItems = useCallback(async () => {
    try { setLoading(true); setMessage(""); setMessageType(""); const res = await api.get("/tuitions"); setItems(getApiCollection(res.data) as TuitionItem[]); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Khong tai duoc hoc phi" : "Khong tai duoc hoc phi"); }
    finally { setLoading(false); }
  }, []);

  const fetchLookups = useCallback(async () => {
    try { const [studentsRes, semestersRes] = await Promise.all([api.get("/student-info"), api.get("/semesters")]); setStudents(getApiCollection(studentsRes.data) as StudentOption[]); setSemesters(getApiCollection(semestersRes.data) as SemesterOption[]); } catch {}
  }, []);

  useEffect(() => { fetchItems(); fetchLookups(); }, [fetchItems, fetchLookups]);

  const filteredItems = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return items
      .filter((item) =>
        String(item.student_name || "").toLowerCase().includes(lowerKeyword) ||
        String(item.student_email || "").toLowerCase().includes(lowerKeyword) ||
        String(item.semester_name || "").toLowerCase().includes(lowerKeyword) ||
        String(item.status || "").toLowerCase().includes(lowerKeyword)
      )
    return sortByLatestDate(
      items.filter((item) =>
        String(item.student_name || "").toLowerCase().includes(lowerKeyword) ||
        String(item.student_email || "").toLowerCase().includes(lowerKeyword) ||
        String(item.semester_name || "").toLowerCase().includes(lowerKeyword) ||
        String(item.status || "").toLowerCase().includes(lowerKeyword)
      ),
      "due_date"
    );
  }, [items, keyword]);

  const resetForm = () => { setFormData(initialForm); setEditingId(null); };
  const closeAllModals = () => { setOpenAddModal(false); setOpenEditModal(false); resetForm(); };

  const validateForm = () => {
    if (!formData.student_id || !formData.semester_id || formData.total_credits < 0 || formData.amount < 0) { setMessageType("error"); setMessage("Vui long nhap day du thong tin hoc phi"); return false; }
    if (formData.paid_amount < 0 || formData.paid_amount > formData.amount) { setMessageType("error"); setMessage("So tien da dong khong hop le"); return false; }
    return true;
  };

  const submitForm = async (mode: "add" | "edit") => {
    if (submitting || !validateForm()) return;
    if (mode === "edit" && !editingId) return;
    try {
      setSubmitting(true); setMessage(""); setMessageType("");
      const payload = { student_id: Number(formData.student_id), semester_id: Number(formData.semester_id), total_credits: Number(formData.total_credits), amount: Number(formData.amount), paid_amount: Number(formData.paid_amount), status: formData.status.trim(), due_date: formData.due_date || null };
      if (mode === "add") { await api.post("/tuitions", payload); toast.success("Them hoc phi thanh cong"); setMessage("Them hoc phi thanh cong"); } else { await api.put(`/tuitions/${editingId}`, payload); toast.success("Cap nhat hoc phi thanh cong"); setMessage("Cap nhat hoc phi thanh cong"); }
      setMessageType("success"); closeAllModals(); fetchItems();
    } catch (error: unknown) {
      setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Luu hoc phi that bai" : "Luu hoc phi that bai");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa hoc phi nay khong?")) return;
    try { await api.delete(`/tuitions/${id}`); toast.success("Xoa hoc phi thanh cong"); setMessage("Xoa hoc phi thanh cong"); setMessageType("success"); fetchItems(); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Xoa hoc phi that bai" : "Xoa hoc phi that bai"); }
  };

  const openEdit = (item: TuitionItem) => {
    setEditingId(item.id);
    setFormData({ student_id: item.student_id ?? 0, semester_id: item.semester_id ?? 0, total_credits: item.total_credits ?? 0, amount: Number(item.amount ?? 0), paid_amount: Number(item.paid_amount ?? 0), status: item.status || "", due_date: item.due_date ? String(item.due_date).slice(0, 10) : "" });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-lg shadow-amber-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><div className="rounded-2xl bg-white/20 p-2 backdrop-blur"><CreditCard size={24} /></div>Tuitions</h1><p className="mt-3 text-sm text-white/85">Quan ly hoc phi theo sinh vien va hoc ky.</p></div>
            <button onClick={() => { resetForm(); setOpenAddModal(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-amber-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"><Plus size={16} />Them hoc phi</button>
          </div>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tim theo sinh vien, email, hoc ky..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100" /></div>
            <div className="text-sm text-slate-500">Tong: <span className="font-semibold text-slate-700">{filteredItems.length}</span> hoc phi</div>
          </div>
          {message && <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
          <div className="overflow-hidden rounded-2xl border border-slate-100"><div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-5 py-4 font-semibold">Sinh vien</th><th className="px-5 py-4 font-semibold">Hoc ky</th><th className="px-5 py-4 font-semibold">So tien</th><th className="px-5 py-4 font-semibold">Trang thai</th><th className="px-5 py-4 font-semibold">Han dong</th><th className="px-5 py-4 text-center font-semibold">Hanh dong</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Dang tai du lieu...</td></tr> : filteredItems.length > 0 ? filteredItems.map((item) => <tr key={item.id} className="border-t border-slate-100 text-sm text-slate-700 odd:bg-white even:bg-slate-50/50"><td className="px-5 py-4"><div className="font-semibold text-slate-800">{item.student_name || "-"}</div><div className="text-xs text-slate-500">{item.student_email || `ID #${item.student_id}`}</div></td><td className="px-5 py-4"><div>{item.semester_name || "-"}</div><div className="text-xs text-slate-500">{Number(item.total_credits ?? 0)} tin chi</div></td><td className="px-5 py-4">{Number(item.amount ?? 0).toLocaleString()} / da dong {Number(item.paid_amount ?? 0).toLocaleString()}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getTuitionStatusClassName(item.status)}`}>{getTuitionStatusLabel(item.status)}</span></td><td className="px-5 py-4">{item.due_date ? String(item.due_date).slice(0, 10) : "-"}</td><td className="px-5 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(item)} className="rounded-xl bg-amber-50 p-2.5 text-amber-700 transition hover:bg-amber-100"><Pencil size={16} /></button><button onClick={() => handleDelete(item.id)} className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Khong co du lieu hoc phi</td></tr>}</tbody></table></div></div>
        </div>
      </div>
      <TuitionModal title="Them hoc phi" open={openAddModal} submitting={submitting} students={students} semesters={semesters} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("add")} />
      <TuitionModal title="Cap nhat hoc phi" open={openEditModal} submitting={submitting} students={students} semesters={semesters} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("edit")} />
    </>
  );
}
