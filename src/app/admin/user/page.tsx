"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import { Pencil, Trash2, Search, Users, Plus, Mail, Phone } from "lucide-react";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import { useToastMessage } from "@/hooks/use-toast-message";
import { toast } from "sonner";

type User = {
  id: number;
  username?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role_id?: number;
};

type UserForm = {
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role_id: number;
  password: string;
};

const initialForm: UserForm = {
  username: "",
  email: "",
  full_name: "",
  phone: "",
  role_id: 0,
  password: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<UserForm>(initialForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  useToastMessage(message, messageType);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const res = await api.get("/users");

      const userList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];

      setUsers(userList);
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Không tải được danh sách user");
      } else {
        setMessage("Không tải được danh sách user");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();

    return users.filter((user) => {
      const username = user.username?.toLowerCase() || "";
      const email = user.email?.toLowerCase() || "";
      const fullName = user.full_name?.toLowerCase() || "";
      const phone = user.phone?.toLowerCase() || "";

      return (
        username.includes(lowerKeyword) ||
        email.includes(lowerKeyword) ||
        fullName.includes(lowerKeyword) ||
        phone.includes(lowerKeyword)
      );
    });
  }, [keyword, users]);

  const handleInputChange = (
    field: keyof UserForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingUserId(null);
  };

  const closeAllModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    resetForm();
  };

  const openAddPopup = () => {
    resetForm();
    setOpenAddModal(true);
  };

  const openEditPopup = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      full_name: user.full_name || "",
      phone: user.phone || "",
      role_id: user.role_id ?? 0,
      password: "",
    });
    setOpenEditModal(true);
  };

  const handleAddUser = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      if (!formData.password.trim()) {
        setMessage("Thiếu mật khẩu");
        setMessageType("error");
        return;
      }

      const payload = {
        ...formData,
        role_id: Number(formData.role_id),
      };

      await api.post("/users", payload);
      toast.success("Them user thanh cong");

      setMessage("Thêm user thành công");
      setMessageType("success");
      closeAllModals();
      fetchUsers();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Thêm user thất bại");
      } else {
        setMessage("Thêm user thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUserId || submitting) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageType("");

      const payload: {
        username: string;
        email: string;
        full_name: string;
        phone: string;
        role_id: number;
        password?: string;
      } = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        role_id: Number(formData.role_id),
      };

      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      await api.put(`/users/${editingUserId}`, payload);
      toast.success("Cap nhat user thanh cong");

      setMessage("Cập nhật user thành công");
      setMessageType("success");
      closeAllModals();
      fetchUsers();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Cập nhật user thất bại");
      } else {
        setMessage("Cập nhật user thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa user này không?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success("Xoa user thanh cong");
      setMessage("Xóa user thành công");
      setMessageType("success");
      fetchUsers();
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xóa user thất bại");
      } else {
        setMessage("Xóa user thất bại");
      }
    }
  };

  const getInitials = (fullName?: string, username?: string) => {
    const value = fullName || username || "U";
    return value
      .trim()
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 p-6 text-white shadow-lg shadow-indigo-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
                <div className="rounded-2xl bg-white/20 p-2 backdrop-blur">
                  <Users size={24} />
                </div>
                Quản lý user
              </h1>
              <p className="mt-3 text-sm text-white/85">
                Xem, tìm kiếm và quản lý danh sách người dùng một cách trực quan hơn.
              </p>
            </div>

            <button
              onClick={openAddPopup}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={16} />
              Thêm user
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
                placeholder="Tìm theo username, email, họ tên, số điện thoại..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <div className="text-sm text-slate-500">
              Tổng:{" "}
              <span className="font-semibold text-slate-700">
                {filteredUsers.length}
              </span>{" "}
              người dùng
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
                      <th className="px-5 py-4 font-semibold">Người dùng</th>
                      <th className="px-5 py-4 font-semibold">Liên hệ</th>
                      <th className="px-5 py-4 font-semibold">SĐT</th>
                      <th className="px-5 py-4 font-semibold">Role ID</th>
                      <th className="px-5 py-4 font-semibold">ID</th>
                      <th className="px-5 py-4 text-center font-semibold">Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-slate-100 text-sm text-slate-700 transition odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white shadow-sm">
                                {getInitials(user.full_name, user.username)}
                              </div>

                              <div>
                                <div className="font-semibold text-slate-800">
                                  {user.full_name || user.username || "-"}
                                </div>
                                <div className="text-sm text-slate-500">
                                  @{user.username || "unknown"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Mail size={14} className="text-slate-400" />
                                <span>{user.email || "-"}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Phone size={14} className="text-slate-400" />
                              <span>{user.phone || "-"}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                              {user.role_id ?? "-"}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-600">
                            #{user.id}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditPopup(user)}
                                className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 transition hover:bg-indigo-100"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                onClick={() => handleDelete(user.id)}
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
                          colSpan={6}
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="rounded-full bg-slate-100 p-4">
                              <Users size={24} className="text-slate-400" />
                            </div>
                            <div className="font-medium text-slate-600">
                              Không có dữ liệu user
                            </div>
                            <div className="text-slate-400">
                              Hãy thử tìm kiếm với từ khóa khác.
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

      <AddUserModal
        open={openAddModal}
        submitting={submitting}
        formData={formData}
        onClose={closeAllModals}
        onChange={handleInputChange}
        onSubmit={handleAddUser}
      />

      <EditUserModal
        open={openEditModal}
        submitting={submitting}
        formData={formData}
        onClose={closeAllModals}
        onChange={handleInputChange}
        onSubmit={handleEditUser}
      />
    </>
  );
}
