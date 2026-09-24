"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  BookOpenCheck,
  BriefcaseBusiness,
  GraduationCap,
  Presentation,
  UserRound,
} from "lucide-react";
import { useToastMessage } from "@/hooks/use-toast-message";
import { loadLecturerPortalData } from "@/lib/lecturer-portal";

type LecturerInfo = {
  id: number;
  user_id?: number;
  username?: string;
  email?: string;
  full_name?: string;
  lecturer_code?: string;
  academic_rank?: string;
  specialization?: string;
};

type CourseSection = {
  id: number;
  subject?: string;
  subject_name?: string;
  subject_id?: number;
  lecturer_id?: number;
  semester?: string;
  semester_name?: string;
  semester_id?: number;
  max_students?: number;
  room?: string;
  schedule?: string;
};

export default function LecturerHomePage() {
  const [lecturerInfo, setLecturerInfo] = useState<LecturerInfo | null>(null);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useToastMessage(error, "error");

  const fetchLecturerHome = useCallback(async () => {
    try {
      setLoading(true);
      const portalData = await loadLecturerPortalData();
      const currentLecturer = portalData.lecturerInfo as LecturerInfo | null;

      if (!currentLecturer) {
        setLecturerInfo(null);
        setCourseSections([]);
        setError("");
        return;
      }

      setLecturerInfo(currentLecturer);
      setCourseSections(portalData.courseSections as CourseSection[]);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc trang giang vien");
      } else {
        setError("Khong tai duoc trang giang vien");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLecturerHome();
  }, [fetchLecturerHome]);

  const uniqueCourseSections = useMemo(() => {
    const seen = new Set<string>();

    return courseSections.filter((item) => {
      const compositeKey = [
        item.id,
        item.subject_id,
        item.subject || item.subject_name,
        item.semester || item.semester_name,
        item.room,
        item.schedule,
      ].join("|");

      if (seen.has(compositeKey)) {
        return false;
      }

      seen.add(compositeKey);
      return true;
    });
  }, [courseSections]);

  const totalCapacity = useMemo(
    () => uniqueCourseSections.reduce((sum, item) => sum + Number(item.max_students || 0), 0),
    [uniqueCourseSections]
  );

  if (loading) {
    return <div className="text-sm text-slate-500">Dang tai trang giang vien...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!lecturerInfo) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Chua co ho so giang vien</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tai khoan nay chua duoc lien ket voi bang `lecturer_info`.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Ma giang vien",
      value: lecturerInfo.lecturer_code || "-",
      icon: UserRound,
      className: "from-emerald-500 to-teal-500",
    },
    {
      label: "Hoc phan phu trach",
      value: String(uniqueCourseSections.length),
      icon: BookOpenCheck,
      className: "from-sky-500 to-blue-500",
    },
    {
      label: "Suc chua toi da",
      value: String(totalCapacity),
      icon: GraduationCap,
      className: "from-violet-500 to-fuchsia-500",
    },
    {
      label: "Hoc ham",
      value: lecturerInfo.academic_rank || "-",
      icon: BriefcaseBusiness,
      className: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_34%)] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Trang chu giang vien
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                Xin chao, {lecturerInfo.username || lecturerInfo.full_name || "Giang vien"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Day la trang tong quan giang day, gom ho so giang vien va cac hoc phan dang
                phu trach.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Chuyen mon</p>
                <p className="mt-1 text-lg font-semibold">{lecturerInfo.specialization || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Hoc ham</p>
                <p className="mt-1 text-lg font-semibold">{lecturerInfo.academic_rank || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.label}-${index}`}
              className={`rounded-3xl bg-gradient-to-r ${item.className} p-6 text-white shadow-lg`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm opacity-90">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold">{item.value}</p>
                </div>
                <Icon size={28} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <UserRound size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Thong tin giang vien</h2>
              <p className="text-sm text-slate-500">Ho so co ban cua giang vien</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Ho ten</span>
              <span className="font-semibold text-slate-900">{lecturerInfo.full_name || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Username</span>
              <span className="font-semibold text-slate-900">{lecturerInfo.username || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900">{lecturerInfo.email || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Ma giang vien</span>
              <span className="font-semibold text-slate-900">
                {lecturerInfo.lecturer_code || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Chuyen mon</span>
              <span className="font-semibold text-slate-900">
                {lecturerInfo.specialization || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Hoc phan phu trach</h2>
              <p className="text-sm text-slate-500">
                Danh sach hoc phan giang vien dang duoc phan cong
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {uniqueCourseSections.length > 0 ? (
              uniqueCourseSections.map((item, index) => (
                <div
                  key={[
                    item.id,
                    item.subject_id,
                    item.semester_id,
                    item.room,
                    item.schedule,
                    index,
                  ].join("-")}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.subject || item.subject_name || `Hoc phan ${item.id}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.semester || item.semester_name || "Chua co hoc ky"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Suc chua: {item.max_students ?? 0}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Giang vien chua duoc phan cong hoc phan nao.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <Presentation size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Tong quan giang day</h2>
              <p className="text-sm text-slate-500">Cac chi so tong hop hien co</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Tong hoc phan</span>
              <span className="font-semibold text-slate-900">{uniqueCourseSections.length}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Tong suc chua</span>
              <span className="font-semibold text-slate-900">{totalCapacity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Hoc ham</span>
              <span className="font-semibold text-slate-900">
                {lecturerInfo.academic_rank || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Ghi chu nhanh</h2>
              <p className="text-sm text-slate-500">Mot so thong tin de doi chieu nhanh</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Ma giang vien</span>
              <span className="font-semibold text-slate-900">
                {lecturerInfo.lecturer_code || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Chuyen mon</span>
              <span className="font-semibold text-slate-900">
                {lecturerInfo.specialization || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900">{lecturerInfo.email || "-"}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
