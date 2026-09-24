"use client";

import { Mail, Phone, Shield, User, Users, Lock, X } from "lucide-react";

type UserForm = {
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role_id: number;
  password: string;
};

type AddUserModalProps = {
  open: boolean;
  submitting: boolean;
  formData: UserForm;
  onClose: () => void;
  onChange: (field: keyof UserForm, value: string | number) => void;
  onSubmit: () => void;
};

export default function AddUserModal({
  open,
  submitting,
  formData,
  onClose,
  onChange,
  onSubmit,
}: AddUserModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Thêm người dùng</h2>
            <p className="mt-1 text-sm text-slate-500">
              Nhập thông tin để tạo tài khoản mới.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Username
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => onChange("username", e.target.value)}
                placeholder="Nhập username"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="Nhập email"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Họ tên
            </label>
            <div className="relative">
              <Users
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => onChange("full_name", e.target.value)}
                placeholder="Nhập họ tên"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Số điện thoại
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => onChange("phone", e.target.value)}
                placeholder="Nhập số điện thoại"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Role ID
            </label>
            <div className="relative">
              <Shield
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="number"
                value={formData.role_id}
                onChange={(e) => onChange("role_id", Number(e.target.value))}
                placeholder="Nhập role id"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="Nhập mật khẩu"
                className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang thêm..." : "Thêm người dùng"}
          </button>
        </div>
      </div>
    </div>
  );
}
