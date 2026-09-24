"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { KeyRound, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type Role = {
  id: number;
  name?: string;
};

type RoleForm = {
  name: string;
};

const initialForm: RoleForm = { name: "" };

function RoleModal({
  title,
  open,
  submitting,
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  title: string;
  open: boolean;
  submitting: boolean;
  value: string;
  onChange: (value: string) => void;
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
            <p className="text-sm text-slate-500">Nhap thong tin vai tro</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <label className="text-sm font-medium">Ten vai tro</label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded-xl border py-2 pl-10 pr-3"
              placeholder="Nhap ten vai tro"
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
            className="rounded-xl bg-violet-600 px-4 py-2 text-white"
          >
            {submitting ? "Dang luu..." : "Luu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoleForm>(initialForm);

  useToastMessage(message, messageType);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");
      const res = await api.get("/roles");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];
      setRoles(data);
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong tai duoc danh sach vai tro");
      } else {
        setMessage("Khong tai duoc danh sach vai tro");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return roles.filter((role) => (role.name || "").toLowerCase().includes(lowerKeyword));
  }, [keyword, roles]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setMessageType("error");
      setMessage("Vui long nhap ten vai tro");
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
      await api.post("/roles", { name: formData.name.trim() });
      toast.success("Them vai tro thanh cong");
      setMessage("Them vai tro thanh cong");
      setMessageType("success");
      closeAllModals();
      fetchRoles();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Them vai tro that bai");
      } else {
        setMessage("Them vai tro that bai");
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
      await api.put(`/roles/${editingId}`, { name: formData.name.trim() });
      toast.success("Cap nhat vai tro thanh cong");
      setMessage("Cap nhat vai tro thanh cong");
      setMessageType("success");
      closeAllModals();
      fetchRoles();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Cap nhat vai tro that bai");
      } else {
        setMessage("Cap nhat vai tro that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa vai tro nay khong?")) return;
    try {
      await api.delete(`/roles/${id}`);
      toast.success("Xoa vai tro thanh cong");
      setMessage("Xoa vai tro thanh cong");
      setMessageType("success");
      fetchRoles();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xoa vai tro that bai");
      } else {
        setMessage("Xoa vai tro that bai");
      }
    }
  };

  const openEdit = (role: Role) => {
    setEditingId(role.id);
    setFormData({ name: role.name || "" });
    setOpenEditModal(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 p-6 text-white shadow-lg shadow-violet-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <KeyRound size={24} />
                </div>
                Quan ly vai tro
              </h1>
              <p className="mt-3 text-sm text-white/85">
                Quan ly role de su dung trong phan quyen tai khoan.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setOpenAddModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-violet-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={16} />
              Them vai tro
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tim theo ten vai tro..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>
            <div className="text-sm text-slate-500">
              Tong: <span className="font-semibold text-slate-700">{filteredRoles.length}</span> vai tro
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
                      <th className="px-5 py-4 font-semibold">Vai tro</th>
                      <th className="px-5 py-4 font-semibold">ID</th>
                      <th className="px-5 py-4 text-center font-semibold">Hanh dong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.length > 0 ? (
                      filteredRoles.map((role) => (
                        <tr
                          key={role.id}
                          className="border-t border-slate-100 text-sm text-slate-700 transition odd:bg-white even:bg-slate-50/50 hover:bg-violet-50/60"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-800">{role.name || "-"}</td>
                          <td className="px-5 py-4 text-slate-600">#{role.id}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEdit(role)}
                                className="rounded-xl bg-violet-50 p-2.5 text-violet-700 transition hover:bg-violet-100"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(role.id)}
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
                        <td colSpan={3} className="px-4 py-12 text-center text-sm text-slate-500">
                          Khong co du lieu vai tro
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

      <RoleModal
        title="Them vai tro"
        open={openAddModal}
        submitting={submitting}
        value={formData.name}
        onChange={(value) => setFormData({ name: value })}
        onClose={closeAllModals}
        onSubmit={handleAdd}
      />
      <RoleModal
        title="Cap nhat vai tro"
        open={openEditModal}
        submitting={submitting}
        value={formData.name}
        onChange={(value) => setFormData({ name: value })}
        onClose={closeAllModals}
        onSubmit={handleEdit}
      />
    </>
  );
}
