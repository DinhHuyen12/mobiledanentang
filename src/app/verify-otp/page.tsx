"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import styles from "./verify.module.css";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");

  const handleChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = localStorage.getItem("email_verify");
    const finalOtp = otp.join("");

    try {
      const res = await api.post("/auth/verify-otp", {
        email,
        otp: finalOtp,
      });

      localStorage.setItem("token", res.data.token);
      router.push("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Lỗi");
      } else {
        setMessage("Lỗi");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Xác thực OTP</h1>
        <p className={styles.subtitle}>Nhập mã 6 số</p>

        <form onSubmit={handleVerify}>
          <div className={styles.otpContainer}>
            {otp.map((value, index) => (
              <input
                key={index}
                maxLength={1}
                className={styles.otpInput}
                value={value}
                onChange={(e) =>
                  handleChange(e.target.value, index)
                }
              />
            ))}
          </div>

          <button className={styles.button}>Xác nhận</button>
        </form>

        {message && <p className={styles.msg}>{message}</p>}
      </div>
    </div>
  );
}