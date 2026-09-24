"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  ScrollText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  clearAuthToken,
  getAuthUser,
  getDefaultRouteByRole,
  isStudentUser,
} from "@/lib/auth";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authUser = getAuthUser();

    if (!authUser) {
      router.replace("/login");
      return;
    }

    if (!isStudentUser(authUser)) {
      router.replace(getDefaultRouteByRole(authUser.role));
    }
  }, [router]);

  const handleLogout = () => {
    clearAuthToken();
    router.replace("/login");
  };

  const navGroups = [
    {
      title: "Thông tin cá nhân",
      items: [
        { href: "/student", label: "Tổng quan", icon: LayoutDashboard },
        { href: "/student/profile", label: "Xem hồ sơ", icon: UserRound },
        { href: "/student/advisors", label: "Cố vấn học tập", icon: UsersRound },
      ],
    },
    {
      title: "Học tập sinh viên",
      items: [
        { href: "/student/schedule", label: "Xem lịch học", icon: CalendarDays },
        { href: "/student/register", label: "Đăng ký học phần", icon: NotebookPen },
        { href: "/student/enrollments", label: "Xem học phần", icon: ClipboardList },
        { href: "/student/attendance", label: "Điểm danh", icon: CalendarCheck2 },
      ],
    },
    {
      title: "Kết quả học tập",
      items: [
        { href: "/student/grades", label: "Xem điểm", icon: GraduationCap },
        { href: "/student/learning-report", label: "Báo cáo học tập", icon: FileText },
        { href: "/student/my-program", label: "Xem CT đào tạo", icon: BookOpenCheck },
        { href: "/student/graduation", label: "Theo dõi tốt nghiệp", icon: ShieldCheck },
      ],
    },
    {
      title: "Tài chính & hồ sơ",
      items: [
        { href: "/student/tuition", label: "Học phí", icon: CreditCard },
        { href: "/student/records", label: "Kỷ luật/Khen thưởng", icon: ScrollText },
      ],
    },
  ];

  return (
    <div className="page-shell relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[24rem] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(240,249,255,0.58))]" />

      <header className="page-header relative border-b border-sky-100/80 bg-white/70">
        <div className="page-container py-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 px-5 py-4 shadow-[0_24px_60px_rgba(14,165,233,0.12)] backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-400 p-3 text-white shadow-lg shadow-sky-200/70">
                    <BookOpenCheck size={22} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">Cổng sinh viên</p>
                    <p className="text-sm text-sky-900/55">
                      Không gian học tập dành cho sinh viên
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200/80 bg-white px-4 py-2.5 text-sm font-medium text-sky-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-md"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>

              <nav className="grid gap-3 xl:grid-cols-4">
                {navGroups.map((group) => (
                  <div key={group.title} className="rounded-3xl border border-sky-100 bg-white/70 p-3">
                    <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700/65">
                      {group.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition duration-200 ${
                              active
                                ? "border-transparent bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-200/80"
                                : "border-white/80 bg-white/82 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:bg-sky-50 hover:text-sky-800"
                            }`}
                          >
                            <Icon size={16} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container relative py-8">{children}</main>
    </div>
  );
}
