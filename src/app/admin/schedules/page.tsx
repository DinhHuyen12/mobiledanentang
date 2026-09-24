"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { CalendarClock, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";
import { BackendScheduleItem, formatScheduleTime, getScheduleDayLabel, getScheduleDayOrder } from "@/lib/schedules";

type ScheduleItem = BackendScheduleItem;
type CourseSectionOption = { id: number; subject?: string; semester?: string };
type ScheduleForm = { course_section_id: number; day_of_week: string; start_time: string; end_time: string; room: string };

const initialForm: ScheduleForm = { course_section_id: 0, day_of_week: "", start_time: "", end_time: "", room: "" };

function getCollection(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && "data" in payload && Array.isArray((payload as { data?: unknown }).data)) return (payload as { data: unknown[] }).data;
  return [];
}

function ScheduleModal({ title, open, submitting, courseSections, formData, onChange, onClose, onSubmit }: { title: string; open: boolean; submitting: boolean; courseSections: CourseSectionOption[]; formData: ScheduleForm; onChange: (field: keyof ScheduleForm, value: string | number) => void; onClose: () => void; onSubmit: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-bold text-slate-800">{title}</h2><p className="text-sm text-slate-500">Nhap thong tin lich hoc</p></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button></div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2"><label className="text-sm font-medium">Lop hoc phan</label><select value={formData.course_section_id || ""} onChange={(e) => onChange("course_section_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon lop hoc phan</option>{courseSections.map((item) => <option key={item.id} value={item.id}>{(item.subject || `Section ${item.id}`) + (item.semester ? ` - ${item.semester}` : "")}</option>)}</select></div>
          <div><label className="text-sm font-medium">Thu</label><input value={formData.day_of_week} onChange={(e) => onChange("day_of_week", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Vi du: Monday" /></div>
          <div><label className="text-sm font-medium">Phong</label><input value={formData.room} onChange={(e) => onChange("room", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Vi du: A101" /></div>
          <div><label className="text-sm font-medium">Bat dau</label><input type="time" value={formData.start_time} onChange={(e) => onChange("start_time", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">Ket thuc</label><input type="time" value={formData.end_time} onChange={(e) => onChange("end_time", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4"><button onClick={onClose} className="rounded-xl border px-4 py-2">Huy</button><button onClick={onSubmit} disabled={submitting} className="rounded-xl bg-cyan-600 px-4 py-2 text-white">{submitting ? "Dang luu..." : "Luu"}</button></div>
      </div>
    </div>
  );
}

export default function SchedulesPage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSectionOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ScheduleForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchItems = useCallback(async () => {
    try { setLoading(true); setMessage(""); setMessageType(""); const res = await api.get("/schedules"); setItems(getCollection(res.data)); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Khong tai duoc lich hoc" : "Khong tai duoc lich hoc"); }
    finally { setLoading(false); }
  }, []);

  const fetchLookups = useCallback(async () => {
    try { const res = await api.get("/course-sections"); setCourseSections(getCollection(res.data)); } catch {}
  }, []);

  useEffect(() => { fetchItems(); fetchLookups(); }, [fetchItems, fetchLookups]);

  const filteredItems = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return items
      .filter((item) =>
        String(item.subject_name || "").toLowerCase().includes(lowerKeyword) ||
        String(item.semester_name || "").toLowerCase().includes(lowerKeyword) ||
        String(item.lecturer_name || "").toLowerCase().includes(lowerKeyword) ||
        String(item.day_of_week || "").toLowerCase().includes(lowerKeyword) ||
        String(item.room || "").toLowerCase().includes(lowerKeyword)
      )
      .sort((a, b) =>
        getScheduleDayOrder(a.day_of_week) - getScheduleDayOrder(b.day_of_week) ||
        String(a.start_time || "").localeCompare(String(b.start_time || "")) ||
        String(a.subject_name || "").localeCompare(String(b.subject_name || ""))
      );
  }, [items, keyword]);

  const resetForm = () => { setFormData(initialForm); setEditingId(null); };
  const closeAllModals = () => { setOpenAddModal(false); setOpenEditModal(false); resetForm(); };

  const validateForm = () => {
    if (!formData.course_section_id || !formData.day_of_week.trim() || !formData.start_time || !formData.end_time) { setMessageType("error"); setMessage("Vui long nhap day du thong tin lich hoc"); return false; }
    return true;
  };

  const submitForm = async (mode: "add" | "edit") => {
    if (submitting || !validateForm()) return;
    if (mode === "edit" && !editingId) return;
    try {
      setSubmitting(true); setMessage(""); setMessageType("");
      const payload = { course_section_id: Number(formData.course_section_id), day_of_week: formData.day_of_week.trim(), start_time: formData.start_time, end_time: formData.end_time, room: formData.room.trim() };
      if (mode === "add") { await api.post("/schedules", payload); toast.success("Them lich hoc thanh cong"); setMessage("Them lich hoc thanh cong"); } else { await api.put(`/schedules/${editingId}`, payload); toast.success("Cap nhat lich hoc thanh cong"); setMessage("Cap nhat lich hoc thanh cong"); }
      setMessageType("success"); closeAllModals(); fetchItems();
    } catch (error: unknown) {
      setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Luu lich hoc that bai" : "Luu lich hoc that bai");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa lich hoc nay khong?")) return;
    try { await api.delete(`/schedules/${id}`); toast.success("Xoa lich hoc thanh cong"); setMessage("Xoa lich hoc thanh cong"); setMessageType("success"); fetchItems(); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Xoa lich hoc that bai" : "Xoa lich hoc that bai"); }
  };

  const openEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setFormData({ course_section_id: item.course_section_id ?? 0, day_of_week: item.day_of_week || "", start_time: item.start_time ? String(item.start_time).slice(0, 5) : "", end_time: item.end_time ? String(item.end_time).slice(0, 5) : "", room: item.room || "" });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 p-6 text-white shadow-lg shadow-cyan-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><div className="rounded-2xl bg-white/20 p-2 backdrop-blur"><CalendarClock size={24} /></div>Schedules</h1><p className="mt-3 text-sm text-white/85">Quan ly lich hoc cho cac lop hoc phan.</p></div>
            <button onClick={() => { resetForm(); setOpenAddModal(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-cyan-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"><Plus size={16} />Them lich hoc</button>
          </div>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tim theo mon hoc, thu, phong..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" /></div>
            <div className="text-sm text-slate-500">Tong: <span className="font-semibold text-slate-700">{filteredItems.length}</span> lich hoc</div>
          </div>
          {message && <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
          <div className="overflow-hidden rounded-2xl border border-slate-100"><div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-5 py-4 font-semibold">Mon hoc</th><th className="px-5 py-4 font-semibold">Giang vien</th><th className="px-5 py-4 font-semibold">Thu</th><th className="px-5 py-4 font-semibold">Gio hoc</th><th className="px-5 py-4 font-semibold">Phong</th><th className="px-5 py-4 text-center font-semibold">Hanh dong</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Dang tai du lieu...</td></tr> : filteredItems.length > 0 ? filteredItems.map((item) => <tr key={item.id} className="border-t border-slate-100 text-sm text-slate-700 odd:bg-white even:bg-slate-50/50"><td className="px-5 py-4"><div className="font-semibold text-slate-800">{item.subject_name || "-"}</div><div className="text-xs text-slate-500">{item.semester_name || "-"}</div></td><td className="px-5 py-4">{item.lecturer_name || `ID #${item.lecturer_id ?? "-"}`}</td><td className="px-5 py-4">{getScheduleDayLabel(item.day_of_week)}</td><td className="px-5 py-4">{`${formatScheduleTime(item.start_time)} - ${formatScheduleTime(item.end_time)}`}</td><td className="px-5 py-4">{item.room || "-"}</td><td className="px-5 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(item)} className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700 transition hover:bg-cyan-100"><Pencil size={16} /></button><button onClick={() => handleDelete(item.id)} className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Khong co du lieu lich hoc</td></tr>}</tbody></table></div></div>
        </div>
      </div>
      <ScheduleModal title="Them lich hoc" open={openAddModal} submitting={submitting} courseSections={courseSections} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("add")} />
      <ScheduleModal title="Cap nhat lich hoc" open={openEditModal} submitting={submitting} courseSections={courseSections} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("edit")} />
    </>
  );
}
