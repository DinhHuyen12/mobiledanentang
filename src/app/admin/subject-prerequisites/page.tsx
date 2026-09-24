"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { GitBranchPlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type PrerequisiteItem = { subject_id: number; subject_code?: string; subject_name?: string; prerequisite_id: number; prerequisite_code?: string; prerequisite_name?: string };
type SubjectOption = { id: number; subject_code?: string; name?: string; subject_name?: string };
type PrerequisiteForm = { subject_id: number; prerequisite_id: number };

const initialForm: PrerequisiteForm = { subject_id: 0, prerequisite_id: 0 };

function getCollection(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "data" in payload && Array.isArray((payload as { data?: unknown }).data)) return (payload as { data: unknown[] }).data;
  return [];
}

function PrerequisiteModal({ title, open, submitting, subjects, formData, onChange, onClose, onSubmit }: { title: string; open: boolean; submitting: boolean; subjects: SubjectOption[]; formData: PrerequisiteForm; onChange: (field: keyof PrerequisiteForm, value: number) => void; onClose: () => void; onSubmit: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-bold text-slate-800">{title}</h2><p className="text-sm text-slate-500">Nhap thong tin mon hoc tien quyet</p></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button></div>
        <div className="grid gap-4 p-6">
          <div><label className="text-sm font-medium">Mon hoc</label><select value={formData.subject_id || ""} onChange={(e) => onChange("subject_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon mon hoc</option>{subjects.map((item) => <option key={item.id} value={item.id}>{`${item.subject_code || ""} ${item.name || item.subject_name || `Subject ${item.id}`}`}</option>)}</select></div>
          <div><label className="text-sm font-medium">Mon tien quyet</label><select value={formData.prerequisite_id || ""} onChange={(e) => onChange("prerequisite_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon mon tien quyet</option>{subjects.filter((item) => item.id !== formData.subject_id).map((item) => <option key={item.id} value={item.id}>{`${item.subject_code || ""} ${item.name || item.subject_name || `Subject ${item.id}`}`}</option>)}</select></div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4"><button onClick={onClose} className="rounded-xl border px-4 py-2">Huy</button><button onClick={onSubmit} disabled={submitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-white">{submitting ? "Dang luu..." : "Luu"}</button></div>
      </div>
    </div>
  );
}

export default function SubjectPrerequisitesPage() {
  const [items, setItems] = useState<PrerequisiteItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingKey, setEditingKey] = useState<{ subjectId: number; prerequisiteId: number } | null>(null);
  const [formData, setFormData] = useState<PrerequisiteForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchItems = useCallback(async () => {
    try { setLoading(true); setMessage(""); setMessageType(""); const res = await api.get("/subject-prerequisites"); setItems(getCollection(res.data)); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Khong tai duoc mon tien quyet" : "Khong tai duoc mon tien quyet"); }
    finally { setLoading(false); }
  }, []);

  const fetchSubjects = useCallback(async () => { try { const res = await api.get("/subjects"); setSubjects(getCollection(res.data)); } catch {} }, []);
  useEffect(() => { fetchItems(); fetchSubjects(); }, [fetchItems, fetchSubjects]);

  const filteredItems = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return items.filter((item) => String(item.subject_name || "").toLowerCase().includes(lowerKeyword) || String(item.prerequisite_name || "").toLowerCase().includes(lowerKeyword) || String(item.subject_code || "").toLowerCase().includes(lowerKeyword) || String(item.prerequisite_code || "").toLowerCase().includes(lowerKeyword));
  }, [items, keyword]);

  const resetForm = () => { setFormData(initialForm); setEditingKey(null); };
  const closeAllModals = () => { setOpenAddModal(false); setOpenEditModal(false); resetForm(); };

  const validateForm = () => {
    if (!formData.subject_id || !formData.prerequisite_id || formData.subject_id === formData.prerequisite_id) { setMessageType("error"); setMessage("Vui long chon mon hoc va mon tien quyet hop le"); return false; }
    return true;
  };

  const submitForm = async (mode: "add" | "edit") => {
    if (submitting || !validateForm()) return;
    if (mode === "edit" && !editingKey) return;
    try {
      setSubmitting(true); setMessage(""); setMessageType("");
      const payload = { subject_id: Number(formData.subject_id), prerequisite_id: Number(formData.prerequisite_id) };
      if (mode === "add") { await api.post("/subject-prerequisites", payload); toast.success("Them mon hoc tien quyet thanh cong"); setMessage("Them mon hoc tien quyet thanh cong"); } else { await api.put(`/subject-prerequisites/${editingKey?.subjectId}/${editingKey?.prerequisiteId}`, payload); toast.success("Cap nhat mon hoc tien quyet thanh cong"); setMessage("Cap nhat mon hoc tien quyet thanh cong"); }
      setMessageType("success"); closeAllModals(); fetchItems();
    } catch (error: unknown) {
      setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Luu mon tien quyet that bai" : "Luu mon tien quyet that bai");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (subjectId: number, prerequisiteId: number) => {
    if (!window.confirm("Ban co chac muon xoa quan he tien quyet nay khong?")) return;
    try { await api.delete(`/subject-prerequisites/${subjectId}/${prerequisiteId}`); toast.success("Xoa mon hoc tien quyet thanh cong"); setMessage("Xoa mon hoc tien quyet thanh cong"); setMessageType("success"); fetchItems(); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Xoa mon tien quyet that bai" : "Xoa mon tien quyet that bai"); }
  };

  const openEdit = (item: PrerequisiteItem) => {
    setEditingKey({ subjectId: item.subject_id, prerequisiteId: item.prerequisite_id });
    setFormData({ subject_id: item.subject_id, prerequisite_id: item.prerequisite_id });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg shadow-emerald-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><div className="rounded-2xl bg-white/20 p-2 backdrop-blur"><GitBranchPlus size={24} /></div>Subject Prerequisites</h1><p className="mt-3 text-sm text-white/85">Quan ly cac quan he mon hoc tien quyet.</p></div>
            <button onClick={() => { resetForm(); setOpenAddModal(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"><Plus size={16} />Them quan he</button>
          </div>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tim theo mon hoc, ma mon..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" /></div>
            <div className="text-sm text-slate-500">Tong: <span className="font-semibold text-slate-700">{filteredItems.length}</span> quan he</div>
          </div>
          {message && <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
          <div className="overflow-hidden rounded-2xl border border-slate-100"><div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-5 py-4 font-semibold">Mon hoc</th><th className="px-5 py-4 font-semibold">Tien quyet</th><th className="px-5 py-4 text-center font-semibold">Hanh dong</th></tr></thead><tbody>{loading ? <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">Dang tai du lieu...</td></tr> : filteredItems.length > 0 ? filteredItems.map((item) => <tr key={`${item.subject_id}-${item.prerequisite_id}`} className="border-t border-slate-100 text-sm text-slate-700 odd:bg-white even:bg-slate-50/50"><td className="px-5 py-4"><div className="font-semibold text-slate-800">{item.subject_name || "-"}</div><div className="text-xs text-slate-500">{item.subject_code || ""}</div></td><td className="px-5 py-4"><div className="font-semibold text-slate-800">{item.prerequisite_name || "-"}</div><div className="text-xs text-slate-500">{item.prerequisite_code || ""}</div></td><td className="px-5 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(item)} className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-100"><Pencil size={16} /></button><button onClick={() => handleDelete(item.subject_id, item.prerequisite_id)} className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">Khong co du lieu mon tien quyet</td></tr>}</tbody></table></div></div>
        </div>
      </div>
      <PrerequisiteModal title="Them mon hoc tien quyet" open={openAddModal} submitting={submitting} subjects={subjects} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("add")} />
      <PrerequisiteModal title="Cap nhat mon hoc tien quyet" open={openEditModal} submitting={submitting} subjects={subjects} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("edit")} />
    </>
  );
}
