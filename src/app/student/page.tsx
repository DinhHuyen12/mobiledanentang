"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  GraduationCap,
  LibraryBig,
  MapPin,
  NotebookPen,
  ScrollText,
  UserRound,
} from "lucide-react";
import api from "@/lib/api";
import { useToastMessage } from "@/hooks/use-toast-message";
import {
  EnrollmentItem,
  GradeItem,
  StudentInfo,
  getAverageScore,
  getCollection,
  getEnrollmentTypeClassName,
  getEnrollmentTypeLabel,
  isActiveEnrollmentStatus,
  isStudentRegistrationType,
  loadStudentPortalData,
} from "@/lib/student-portal";
import {
  BackendScheduleItem,
  formatScheduleTime,
  getScheduleDayLabel,
  getScheduleDayOrder,
} from "@/lib/schedules";
import { getApiCollection, TuitionItem } from "@/lib/tuition";

type DashboardState = {
  studentInfo: StudentInfo | null;
  enrollments: EnrollmentItem[];
  grades: GradeItem[];
  schedules: BackendScheduleItem[];
  tuitions: TuitionItem[];
};

const EMPTY_STATE: DashboardState = {
  studentInfo: null,
  enrollments: [],
  grades: [],
  schedules: [],
  tuitions: [],
};

const getRemainingAmount = (tuition: TuitionItem) =>
  Math.max(Number(tuition.amount || 0) - Number(tuition.paid_amount || 0), 0);

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10) || "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatMoney = (value?: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getEnrollmentStatusLabel = (status?: string) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "completed") return "Học lại";
  if (normalized === "cancelled" || normalized === "canceled") return "Đã hủy";
  if (normalized === "dropped") return "Đã rút";
  if (normalized === "active") return "Đang học";
  return status || "Chưa cập nhật";
};

export default function StudentHomePage() {
  const [dashboard, setDashboard] = useState<DashboardState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useToastMessage(error, "error");

  const fetchStudentHome = useCallback(async () => {
    try {
      setLoading(true);

      const [portalData, schedulesRes, tuitionsRes] = await Promise.all([
        loadStudentPortalData(),
        api.get("/schedules"),
        api.get("/tuitions"),
      ]);

      const activeEnrollments = portalData.enrollments.filter((item) =>
        isActiveEnrollmentStatus(item.status)
      );
      const visibleEnrollments = portalData.enrollments.filter((item) =>
        isStudentRegistrationType(item)
      );
      const sectionIds = new Set(
        activeEnrollments.map((item) => Number(item.course_section_id))
      );
      const scheduleList = (getCollection(schedulesRes.data) as BackendScheduleItem[])
        .filter((item) => sectionIds.has(Number(item.course_section_id)))
        .sort((left, right) => {
          return (
            getScheduleDayOrder(left.day_of_week) - getScheduleDayOrder(right.day_of_week) ||
            String(left.start_time || "").localeCompare(String(right.start_time || "")) ||
            String(left.subject_name || "").localeCompare(String(right.subject_name || ""))
          );
        });

      const tuitionList = (getApiCollection(tuitionsRes.data) as TuitionItem[])
        .filter(
          (item) => Number(item.student_id) === Number(portalData.studentInfo?.id)
        )
        .sort((left, right) => {
          return String(right.due_date || "").localeCompare(String(left.due_date || ""));
        });

      setDashboard({
        studentInfo: portalData.studentInfo,
        enrollments: visibleEnrollments,
        grades: portalData.grades,
        schedules: scheduleList,
        tuitions: tuitionList,
      });
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được trang sinh viên");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được trang sinh viên");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentHome();
  }, [fetchStudentHome]);

  const { studentInfo, enrollments, grades, schedules, tuitions } = dashboard;

  const averageScore = useMemo(() => getAverageScore(grades), [grades]);
  const nextClasses = useMemo(() => schedules.slice(0, 4), [schedules]);
  const latestGrades = useMemo(() => grades.slice(0, 5), [grades]);
  const outstandingTuitions = useMemo(
    () => tuitions.filter((item) => getRemainingAmount(item) > 0),
    [tuitions]
  );
  const totalOutstanding = useMemo(
    () =>
      outstandingTuitions.reduce(
        (sum, item) => sum + getRemainingAmount(item),
        0
      ),
    [outstandingTuitions]
  );

  const statCards = [
    {
      label: "Lớp hiện tại",
      value: studentInfo?.class_name || "-",
      icon: GraduationCap,
      className: "from-sky-500 to-blue-600",
    },
    {
      label: "Học phần đã đăng ký",
      value: String(enrollments.length),
      icon: LibraryBig,
      className: "from-emerald-500 to-teal-600",
    },
    {
      label: "Điểm trung bình",
      value: averageScore,
      icon: Award,
      className: "from-amber-500 to-orange-600",
    },
    {
      label: "Còn phải đóng",
      value: formatMoney(totalOutstanding),
      icon: CreditCard,
      className: "from-rose-500 to-pink-600",
    },
  ];

  const quickLinks = [
    {
      href: "/student/profile",
      label: "Hồ sơ sinh viên",
      description: "Xem thông tin cá nhân và tình trạng học tập.",
      icon: UserRound,
      accent: "bg-sky-100 text-sky-700",
    },
    {
      href: "/student/register",
      label: "Đăng ký học phần",
      description: "Mở danh sách lớp học phần và đăng ký nhanh.",
      icon: NotebookPen,
      accent: "bg-amber-100 text-amber-700",
    },
    {
      href: "/student/schedule",
      label: "Lịch học",
      description: "Theo dõi lịch học theo tuần từ các lớp đã đăng ký.",
      icon: CalendarDays,
      accent: "bg-cyan-100 text-cyan-700",
    },
    {
      href: "/student/attendance",
      label: "Điểm danh",
      description: "Kiểm tra tình trạng điểm danh theo từng buổi học.",
      icon: CalendarCheck2,
      accent: "bg-emerald-100 text-emerald-700",
    },
    {
      href: "/student/grades",
      label: "Bảng điểm",
      description: "Xem điểm quá trình, cuối kỳ và điểm chữ.",
      icon: BookOpen,
      accent: "bg-violet-100 text-violet-700",
    },
    {
      href: "/student/tuition",
      label: "Học phí",
      description: "Theo dõi công nợ và lịch sử thanh toán học phí.",
      icon: CreditCard,
      accent: "bg-rose-100 text-rose-700",
    },
    {
      href: "/student/records",
      label: "Kỷ luật/Khen thưởng",
      description: "Xem học bổng đã cấp và các quyết định kỷ luật của bạn.",
      icon: ScrollText,
      accent: "bg-indigo-100 text-indigo-700",
    },
  ];

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải trang sinh viên...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!studentInfo) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Chưa có hồ sơ sinh viên</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tài khoản này chưa được liên kết với bảng `student_info`.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(244,63,94,0.18),_transparent_34%)] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Cổng thông tin sinh viên
              </p>
              <h1 className="mt-3 text-3xl font-bold">
                Xin chào, {studentInfo.username || studentInfo.full_name || "Sinh viên"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Đây là trang tổng quan học tập của bạn, đồng bộ từ hồ sơ sinh viên,
                đăng ký học phần, lịch học, điểm số và học phí.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Mã đăng nhập</p>
                <p className="mt-1 text-lg font-semibold">{studentInfo.username || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Trạng thái</p>
                <p className="mt-1 text-lg font-semibold">{studentInfo.status || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Lớp</p>
                <p className="mt-1 text-lg font-semibold">{studentInfo.class_name || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Ngày nhập học</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatDate(studentInfo.enrollment_date)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-3xl bg-gradient-to-r ${item.className} p-6 text-white shadow-lg`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm opacity-90">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold break-words">{item.value}</p>
                </div>
                <Icon size={28} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`mb-4 inline-flex rounded-2xl p-3 ${item.accent}`}>
                    <Icon size={18} />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">{item.label}</h2>
                  <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-400 transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <UserRound size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Thông tin cá nhân</h2>
              <p className="text-sm text-slate-500">Tóm tắt hồ sơ học vụ hiện tại.</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Họ tên</span>
              <span className="font-semibold text-slate-900">{studentInfo.full_name || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-900">{studentInfo.email || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Username</span>
              <span className="font-semibold text-slate-900">{studentInfo.username || "-"}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-slate-500">Lớp</span>
              <span className="font-semibold text-slate-900">{studentInfo.class_name || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ngày nhập học</span>
              <span className="font-semibold text-slate-900">
                {formatDate(studentInfo.enrollment_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Học phần đã đăng ký</h2>
              <p className="text-sm text-slate-500">
                Danh sách môn học được đồng bộ từ backend đăng ký học phần.
              </p>
            </div>
            <Link
              href="/student/enrollments"
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {enrollments.length > 0 ? (
              enrollments.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.subject_name || `Học phần ${item.course_section_id}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.semester_name || "Chưa có học kỳ"}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getEnrollmentTypeClassName(item)}`}
                      >
                        {getEnrollmentTypeLabel(item)}
                      </span>
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {getEnrollmentStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {item.lecturer_name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={14} className="text-slate-400" />
                          {item.lecturer_name}
                        </span>
                      ) : null}
                      {item.room ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} className="text-slate-400" />
                          {item.room}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Bạn chưa có học phần nào được đăng ký.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Lịch học gần nhất</h2>
              <p className="text-sm text-slate-500">
                Tổng hợp từ bảng `schedules` theo các lớp bạn đang học.
              </p>
            </div>
            <Link
              href="/student/schedule"
              className="text-sm font-medium text-sky-700 hover:text-sky-800"
            >
              Xem lịch đầy đủ
            </Link>
          </div>

          <div className="space-y-3">
            {nextClasses.length > 0 ? (
              nextClasses.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.subject_name || `Học phần ${item.course_section_id}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.semester_name || "Chưa có học kỳ"}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {getScheduleDayLabel(item.day_of_week)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={14} className="text-slate-400" />
                      {formatScheduleTime(item.start_time)} - {formatScheduleTime(item.end_time)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {item.room || "Chưa có phòng học"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound size={14} className="text-slate-400" />
                      {item.lecturer_name || "Chưa có giảng viên"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chưa có lịch học cho các học phần đã đăng ký.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Học phí cần lưu ý</h2>
              <p className="text-sm text-slate-500">
                Các khoản còn nợ được lấy từ bảng học phí của sinh viên.
              </p>
            </div>
            <Link
              href="/student/tuition"
              className="text-sm font-medium text-rose-700 hover:text-rose-800"
            >
              Xem chi tiết
            </Link>
          </div>

          <div className="space-y-3">
            {outstandingTuitions.length > 0 ? (
              outstandingTuitions.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.semester_name || "Học kỳ chưa xác định"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Hạn đóng: {formatDate(item.due_date)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">
                      Còn {formatMoney(getRemainingAmount(item))}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    Đã đóng {formatMoney(item.paid_amount)} trên tổng {formatMoney(item.amount)}.
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Hiện không có khoản học phí nào cần thanh toán thêm.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Bảng điểm gần đây</h2>
            <p className="text-sm text-slate-500">
              Tổng hợp kết quả học tập của các học phần đã có điểm.
            </p>
          </div>
          <Link
            href="/student/grades"
            className="text-sm font-medium text-violet-700 hover:text-violet-800"
          >
            Xem bảng điểm
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Chuyên cần</th>
                  <th className="px-6 py-4">Giữa kỳ</th>
                  <th className="px-6 py-4">Cuối kỳ</th>
                  <th className="px-6 py-4">Tổng điểm</th>
                  <th className="px-6 py-4">Điểm chữ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {latestGrades.length > 0 ? (
                  latestGrades.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.subject_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.attendance_score ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.midterm_score ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.final_score ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {item.total_score ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                          {item.letter_grade || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      Chưa có dữ liệu điểm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
