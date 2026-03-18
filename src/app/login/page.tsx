"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/auth/login", form);
      localStorage.setItem("email_verify", form.email);
      router.push("/verify-otp");
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
      <div className={styles.overlay}>
        <h1 className={styles.title}>LOGIN NOW</h1>

        <form onSubmit={handleLogin}>
          <input
            className={styles.input}
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <button className={styles.button}>LOGIN</button>
        </form>

        <div className={styles.bottom}>
          <span>Forgot password?</span>
          <span>Register</span>
        </div>

        {message && <p className={styles.msg}>{message}</p>}
      </div>
    </div>
  );
}