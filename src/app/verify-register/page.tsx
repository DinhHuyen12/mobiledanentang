"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  clearPendingRegisterData,
  PendingRegisterPayload,
  getPendingRegisterData,
} from "@/lib/auth";
import { toast } from "sonner";
import { useToastMessage } from "@/hooks/use-toast-message";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function VerifyRegisterPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRegister, setPendingRegister] =
    useState<PendingRegisterPayload | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");

  useToastMessage(message, "error");

  useEffect(() => {
    setPendingRegister(getPendingRegisterData());
    const query = new URLSearchParams(window.location.search);
    setDemoOtp(query.get("demoOtp") || "");
    setIsReady(true);
  }, []);

  const handleVerifyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!pendingRegister) {
      setMessage("Khong tim thay du lieu dang ky. Vui long dang ky lai.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/auth/verify-register", {
        ...pendingRegister,
        otp: otp.trim(),
      });

      clearPendingRegisterData();
      toast.success("Xac thuc dang ky thanh cong");
      router.push("/login");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Xac thuc dang ky that bai");
      } else {
        setMessage("Xac thuc dang ky that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 px-4">
      <Card className="w-full max-w-md rounded-3xl shadow-2xl">
        <CardContent className="space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Xac thuc dang ky</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nhap OTP backend da gui cho email dang ky cua ban.
            </p>
          </div>

          {!isReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Dang tai du lieu dang ky...
            </div>
          ) : pendingRegister ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Email dang xac thuc:{" "}
              <span className="font-medium text-slate-800">
                {pendingRegister.email}
              </span>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Khong tim thay du lieu dang ky tam. Hay quay lai trang register.
            </div>
          )}

          {demoOtp && (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
              OTP demo tu BE: <span className="font-semibold">{demoOtp}</span>
            </div>
          )}

          <form onSubmit={handleVerifyRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>OTP</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Nhap ma OTP"
                className="h-11 text-center text-lg tracking-[0.35em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <Button
              className="h-11 w-full"
              disabled={submitting || !pendingRegister}
            >
              {submitting ? "Dang xac thuc..." : "Hoan tat dang ky"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Quay lai{" "}
            <Link
              href="/register"
              className="font-medium text-slate-900 hover:underline"
            >
              trang dang ky
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
