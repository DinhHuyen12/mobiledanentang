"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Mail, UserRound } from "lucide-react";
import { LecturerInfo, loadLecturerPortalData } from "@/lib/lecturer-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

export default function LecturerProfilePage() {
  const [lecturerInfo, setLecturerInfo] = useState<LecturerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useToastMessage(error, "error");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadLecturerPortalData();
      setLecturerInfo(data.lecturerInfo);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc ho so giang vien");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Khong tai duoc ho so giang vien");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <div className="text-sm text-slate-500">Dang tai ho so giang vien...</div>;
  if (error) return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  if (!lecturerInfo) return <div className="rounded-3xl bg-white p-8 text-center shadow-sm">Chua co ho so giang vien.</div>;

  const cards = [
    { label: "Ho ten", value: lecturerInfo.full_name || "-", icon: UserRound },
    { label: "Email", value: lecturerInfo.email || "-", icon: Mail },
    { label: "Ma giang vien", value: lecturerInfo.lecturer_code || "-", icon: UserRound },
    { label: "Hoc ham", value: lecturerInfo.academic_rank || "-", icon: BriefcaseBusiness },
    { label: "Chuyen mon", value: lecturerInfo.specialization || "-", icon: BriefcaseBusiness },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Lecturer Profile</p>
        <h1 className="mt-3 text-3xl font-bold">{lecturerInfo.full_name || lecturerInfo.username || "Giang vien"}</h1>
        <p className="mt-2 text-sm text-slate-300">Xem lai thong tin ho so giang vien.</p>
      </section>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Icon size={20} /></div>
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
