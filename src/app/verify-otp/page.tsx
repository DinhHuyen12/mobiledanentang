"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  clearPendingVerifyEmail,
  getDefaultRouteByRole,
  getPendingVerifyEmail,
  parseAuthToken,
  setAuthToken,
} from "@/lib/auth";
import { toast } from "sonner";
import { useToastMessage } from "@/hooks/use-toast-message";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function VerifyOtpPage() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  useToastMessage(message, "error");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = getPendingVerifyEmail();

    if (!email) {
      setMessage("Không tìm thấy email xác thực. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      setAuthToken(res.data.token);
      clearPendingVerifyEmail();
      const authUser = parseAuthToken(res.data.token);
      toast.success("Xac thuc OTP thanh cong");
      router.push(getDefaultRouteByRole(authUser?.role));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Lỗi");
      } else {
        setMessage("Lỗi");
      }
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <Card className="w-[380px] rounded-2xl shadow-xl">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Xác thực OTP</h1>
            <p className="text-sm text-muted-foreground">
              Nhập mã đã gửi vào email
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1">
              <Label>OTP</Label>

              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Nhập mã OTP"
                className="h-11 text-center text-lg tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <Button className="h-11 w-full">Xác nhận</Button>
          </form>

          {message && <p className="text-center text-sm text-red-500">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
