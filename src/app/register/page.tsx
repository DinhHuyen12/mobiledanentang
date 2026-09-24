"use client";

import axios from "axios";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import api from "@/lib/api";
import {
  PendingRegisterPayload,
  STUDENT_ROLE_ID,
  setPendingRegisterData,
} from "@/lib/auth";
import { toast } from "sonner";
import { useToastMessage } from "@/hooks/use-toast-message";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type RegisterForm = PendingRegisterPayload & {
  confirmPassword: string;
};

const initialForm: RegisterForm = {
  username: "",
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role_id: STUDENT_ROLE_ID,
  class_id: undefined,
  enrollment_date: "",
  status: "active",
};

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<RegisterForm>(initialForm);

  useToastMessage(message, "error");

  const canSubmit = useMemo(() => {
    if (
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.full_name.trim()
    ) {
      return false;
    }

    if (form.password !== form.confirmPassword) {
      return false;
    }

    return Boolean(form.class_id && form.enrollment_date && form.status);
  }, [form]);

  const updateForm = <K extends keyof RegisterForm>(
    field: K,
    value: RegisterForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildPayload = (): PendingRegisterPayload => ({
    username: form.username.trim(),
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    password: form.password,
    role_id: STUDENT_ROLE_ID,
    class_id: Number(form.class_id),
    enrollment_date: form.enrollment_date,
    status: form.status,
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Mat khau xac nhan khong khop");
      return;
    }

    const payload = buildPayload();

    try {
      setSubmitting(true);
      const res = await api.post("/auth/register", payload);
      setPendingRegisterData(payload);

      const nextOtpHint =
        typeof res.data?.otp === "string" || typeof res.data?.otp === "number"
          ? String(res.data.otp)
          : "";

      const query = nextOtpHint
        ? `?demoOtp=${encodeURIComponent(nextOtpHint)}`
        : "";

      toast.success("Gui OTP dang ky thanh cong");
      router.push(`/verify-register${query}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Khong the gui OTP dang ky");
      } else {
        setMessage("Khong the gui OTP dang ky");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Card className="rounded-3xl shadow-2xl">
          <CardContent className="p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Tao tai khoan moi
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Dang ky cong khai chi danh cho tai khoan sinh vien.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Da co tai khoan?{" "}
                <Link
                  href="/login"
                  className="font-medium text-slate-900 hover:underline"
                >
                  Dang nhap
                </Link>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      Tai khoan sinh vien
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tai khoan giang vien va quan tri vien chi duoc tao boi admin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => updateForm("username", e.target.value)}
                    placeholder="nhap username"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ho va ten</Label>
                  <Input
                    value={form.full_name}
                    onChange={(e) => updateForm("full_name", e.target.value)}
                    placeholder="nhap ho va ten"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    placeholder="you@example.com"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>So dien thoai</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="nhap so dien thoai"
                    className="h-11"
                  />
                </div>

                <div className="relative space-y-2">
                  <Label>Mat khau</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    placeholder="nhap mat khau"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-[38px] text-muted-foreground hover:text-black"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative space-y-2">
                  <Label>Xac nhan mat khau</Label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateForm("confirmPassword", e.target.value)
                    }
                    placeholder="nhap lai mat khau"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-[38px] text-muted-foreground hover:text-black"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                <div className="mb-4">
                  <h2 className="font-semibold text-slate-900">
                    Thong tin sinh vien
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cac truong nay duoc backend yeu cau bat buoc.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Class ID</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.class_id ?? ""}
                      onChange={(e) =>
                        updateForm(
                          "class_id",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="Nhap Class ID"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ngay nhap hoc</Label>
                    <Input
                      type="date"
                      value={form.enrollment_date || ""}
                      onChange={(e) =>
                        updateForm("enrollment_date", e.target.value)
                      }
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trang thai</Label>
                    <select
                      value={form.status || "active"}
                      onChange={(e) => updateForm("status", e.target.value)}
                      className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="studying">studying</option>
                      <option value="graduated">graduated</option>
                    </select>
                  </div>
                </div>
              </div>

              {message && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {message}
                </div>
              )}

              <Button
                className="h-11 w-full text-base"
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Dang gui OTP..." : "Dang ky va gui OTP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
