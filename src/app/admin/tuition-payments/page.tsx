"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { HandCoins, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";
import {
  getApiCollection,
  sortByLatestDate,
  type TuitionItem,
  type TuitionPaymentItem,
} from "@/lib/tuition";

type PaymentItem = TuitionPaymentItem;
type TuitionOption = TuitionItem;
type PaymentForm = { tuition_id: number; payment_date: string; amount: number; payment_method: string; note: string };

const initialForm: PaymentForm = { tuition_id: 0, payment_date: "", amount: 0, payment_method: "", note: "" };

function PaymentModal({ title, open, submitting, tuitions, formData, onChange, onClose, onSubmit }: { title: string; open: boolean; submitting: boolean; tuitions: TuitionOption[]; formData: PaymentForm; onChange: (field: keyof PaymentForm, value: string | number) => void; onClose: () => void; onSubmit: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5"><div><h2 className="text-xl font-bold text-slate-800">{title}</h2><p className="text-sm text-slate-500">Nhap thong tin thanh toan hoc phi</p></div><button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button></div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2"><label className="text-sm font-medium">Hoc phi</label><select value={formData.tuition_id || ""} onChange={(e) => onChange("tuition_id", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2"><option value="">Chon hoc phi</option>{tuitions.map((item) => <option key={item.id} value={item.id}>{`${item.student_name || "Sinh vien"}${item.student_email ? ` - ${item.student_email}` : ""} - ${item.semester_name || "Hoc ky"} - ${Number(item.amount ?? 0).toLocaleString()}`}</option>)}</select></div>
          <div><label className="text-sm font-medium">Ngay thanh toan</label><input type="date" value={formData.payment_date} onChange={(e) => onChange("payment_date", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">So tien</label><input type="number" min={0} value={formData.amount} onChange={(e) => onChange("amount", Number(e.target.value))} className="mt-1 w-full rounded-xl border px-3 py-2" /></div>
          <div><label className="text-sm font-medium">Phuong thuc</label><input value={formData.payment_method} onChange={(e) => onChange("payment_method", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Vi du: cash" /></div>
          <div><label className="text-sm font-medium">Ghi chu</label><input value={formData.note} onChange={(e) => onChange("note", e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Nhap ghi chu" /></div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4"><button onClick={onClose} className="rounded-xl border px-4 py-2">Huy</button><button onClick={onSubmit} disabled={submitting} className="rounded-xl bg-emerald-600 px-4 py-2 text-white">{submitting ? "Dang luu..." : "Luu"}</button></div>
      </div>
    </div>
  );
}

export default function TuitionPaymentsPage() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [tuitions, setTuitions] = useState<TuitionOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PaymentForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchItems = useCallback(async () => {
    try { setLoading(true); setMessage(""); setMessageType(""); const res = await api.get("/tuition-payments"); setItems(getApiCollection(res.data) as PaymentItem[]); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Khong tai duoc thanh toan hoc phi" : "Khong tai duoc thanh toan hoc phi"); }
    finally { setLoading(false); }
  }, []);

  const fetchLookups = useCallback(async () => {
    try { const res = await api.get("/tuitions"); setTuitions(getApiCollection(res.data) as TuitionOption[]); } catch {}
  }, []);

  useEffect(() => { fetchItems(); fetchLookups(); }, [fetchItems, fetchLookups]);

  const filteredItems = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return sortByLatestDate(
      items.filter((item) => String(item.student_name || "").toLowerCase().includes(lowerKeyword) || String(item.student_email || "").toLowerCase().includes(lowerKeyword) || String(item.semester_name || "").toLowerCase().includes(lowerKeyword) || String(item.payment_method || "").toLowerCase().includes(lowerKeyword) || String(item.note || "").toLowerCase().includes(lowerKeyword)),
      "payment_date"
    );
  }, [items, keyword]);

  const resetForm = () => { setFormData(initialForm); setEditingId(null); };
  const closeAllModals = () => { setOpenAddModal(false); setOpenEditModal(false); resetForm(); };

  const validateForm = () => {
    if (!formData.tuition_id || !formData.payment_date || formData.amount < 0) { setMessageType("error"); setMessage("Vui long nhap day du thong tin thanh toan"); return false; }
    return true;
  };

  const submitForm = async (mode: "add" | "edit") => {
    if (submitting || !validateForm()) return;
    if (mode === "edit" && !editingId) return;
    try {
      setSubmitting(true); setMessage(""); setMessageType("");
      const payload = { tuition_id: Number(formData.tuition_id), payment_date: formData.payment_date, amount: Number(formData.amount), payment_method: formData.payment_method.trim(), note: formData.note.trim() };
      if (mode === "add") { await api.post("/tuition-payments", payload); toast.success("Them thanh toan hoc phi thanh cong"); setMessage("Them thanh toan hoc phi thanh cong"); } else { await api.put(`/tuition-payments/${editingId}`, payload); toast.success("Cap nhat thanh toan hoc phi thanh cong"); setMessage("Cap nhat thanh toan hoc phi thanh cong"); }
      setMessageType("success"); closeAllModals(); fetchItems();
    } catch (error: unknown) {
      setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Luu thanh toan hoc phi that bai" : "Luu thanh toan hoc phi that bai");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa giao dich thanh toan nay khong?")) return;
    try { await api.delete(`/tuition-payments/${id}`); toast.success("Xoa thanh toan hoc phi thanh cong"); setMessage("Xoa thanh toan hoc phi thanh cong"); setMessageType("success"); fetchItems(); }
    catch (error: unknown) { setMessageType("error"); setMessage(axios.isAxiosError(error) ? error.response?.data?.message || "Xoa thanh toan hoc phi that bai" : "Xoa thanh toan hoc phi that bai"); }
  };

  const openEdit = (item: PaymentItem) => {
    setEditingId(item.id);
    setFormData({ tuition_id: item.tuition_id ?? 0, payment_date: item.payment_date ? String(item.payment_date).slice(0, 10) : "", amount: Number(item.amount ?? 0), payment_method: item.payment_method || "", note: item.note || "" });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 p-6 text-white shadow-lg shadow-emerald-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><div className="rounded-2xl bg-white/20 p-2 backdrop-blur"><HandCoins size={24} /></div>Tuition Payments</h1><p className="mt-3 text-sm text-white/85">Quan ly giao dich dong hoc phi cua sinh vien.</p></div>
            <button onClick={() => { resetForm(); setOpenAddModal(true); }} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"><Plus size={16} />Them giao dich</button>
          </div>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tim theo sinh vien, email, hoc ky, phuong thuc..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" /></div>
            <div className="text-sm text-slate-500">Tong: <span className="font-semibold text-slate-700">{filteredItems.length}</span> giao dich</div>
          </div>
          {message && <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-medium ${messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
          <div className="overflow-hidden rounded-2xl border border-slate-100"><div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500"><th className="px-5 py-4 font-semibold">Sinh vien</th><th className="px-5 py-4 font-semibold">Ngay dong</th><th className="px-5 py-4 font-semibold">So tien</th><th className="px-5 py-4 font-semibold">Phuong thuc</th><th className="px-5 py-4 font-semibold">Ghi chu</th><th className="px-5 py-4 text-center font-semibold">Hanh dong</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Dang tai du lieu...</td></tr> : filteredItems.length > 0 ? filteredItems.map((item) => <tr key={item.id} className="border-t border-slate-100 text-sm text-slate-700 odd:bg-white even:bg-slate-50/50"><td className="px-5 py-4"><div className="font-semibold text-slate-800">{item.student_name || "-"}</div><div className="text-xs text-slate-500">{item.student_email || "Khong co email"} - {item.semester_name || "-"}</div></td><td className="px-5 py-4">{item.payment_date ? String(item.payment_date).slice(0, 10) : "-"}</td><td className="px-5 py-4">{Number(item.amount ?? 0).toLocaleString()}</td><td className="px-5 py-4">{item.payment_method || "-"}</td><td className="px-5 py-4 text-slate-600">{item.note || "-"}</td><td className="px-5 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(item)} className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-100"><Pencil size={16} /></button><button onClick={() => handleDelete(item.id)} className="rounded-xl bg-red-50 p-2.5 text-red-500 transition hover:bg-red-100"><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">Khong co du lieu thanh toan hoc phi</td></tr>}</tbody></table></div></div>
        </div>
      </div>
      <PaymentModal title="Them thanh toan hoc phi" open={openAddModal} submitting={submitting} tuitions={tuitions} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("add")} />
      <PaymentModal title="Cap nhat thanh toan hoc phi" open={openEditModal} submitting={submitting} tuitions={tuitions} formData={formData} onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))} onClose={closeAllModals} onSubmit={() => submitForm("edit")} />
    </>
  );
}
