"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setPendingVerifyEmail } from "@/lib/auth";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useToastMessage } from "@/hooks/use-toast-message";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  useToastMessage(message, "error");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/auth/login", form);
      toast.success("Dang nhap thanh cong, vui long xac thuc OTP");
      setPendingVerifyEmail(form.email);
      router.push("/verify-otp");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Dang nhap that bai");
      } else {
        setMessage("Dang nhap that bai");
      }
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <Card className="w-[380px] rounded-2xl shadow-xl">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-wide">LOGIN NOW</h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="h-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="relative space-y-1">
              <Label>Password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="h-11 pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button className="h-11 w-full text-base font-medium">LOGIN</Button>
          </form>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-black">
              Forgot password?
            </span>
            <Link href="/register" className="cursor-pointer hover:text-black">
              Register
            </Link>
          </div>

          {message && (
            <p className="text-center text-sm text-red-500">{message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
