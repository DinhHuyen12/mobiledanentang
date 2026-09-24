"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookCopy,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarRange,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  GitBranchPlus,
  GraduationCap,
  HandCoins,
  KeyRound,
  LayoutDashboard,
  Layers,
  LogOut,
  ScrollText,
  ShieldCheck,
  Trophy,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";
import {
  clearAuthToken,
  getAuthUser,
  getDefaultRouteByRole,
  isAdminUser,
} from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const authUser = getAuthUser();
  const [openGroup, setOpenGroup] = useState("");

  useEffect(() => {
    if (!authUser) {
      router.replace("/login");
      return;
    }

    if (!isAdminUser(authUser)) {
      router.replace(getDefaultRouteByRole(authUser.role));
    }
  }, [authUser, router]);

  const handleLogout = () => {
    clearAuthToken();
    router.replace("/login");
  };

  const navGroups = useMemo(() => [
    {
      title: "Quản lý hệ thống",
      items: [
        { href: "/admin/dashboard", label: "Xem tổng quan", icon: LayoutDashboard },
        { href: "/admin/user", label: "Quản lý người dùng", icon: Users },
        { href: "/admin/roles", label: "Quản lý vai trò", icon: KeyRound },
      ],
    },
    {
      title: "Quản lý đào tạo",
      items: [
        { href: "/admin/faculties", label: "Quản lý khoa", icon: Building2 },
        { href: "/admin/subjects", label: "Quản lý môn học", icon: BookOpen },
        { href: "/admin/subject-prerequisites", label: "Môn tiên quyết", icon: GitBranchPlus },
        { href: "/admin/training-programs", label: "Quản lý CT đào tạo", icon: BookCopy },
        { href: "/admin/academic-years", label: "Quản lý năm học", icon: CalendarRange },
        { href: "/admin/semesters", label: "Quản lý học kỳ", icon: CalendarRange },
      ],
    },
    {
      title: "Quản lý đối tượng",
      items: [
        { href: "/admin/students", label: "Quản lý sinh viên", icon: GraduationCap },
        { href: "/admin/classes", label: "Quản lý lớp học", icon: Layers },
        { href: "/admin/academic-advisors", label: "Cố vấn học tập", icon: UserCog },
        { href: "/admin/records", label: "Trạng thái sinh viên", icon: ScrollText },
      ],
    },
    {
      title: "Quản lý học tập",
      items: [
        { href: "/admin/course-sections", label: "Lớp học phần", icon: BookCopy },
        { href: "/admin/schedules", label: "Lịch học", icon: CalendarClock },
        { href: "/admin/enrollments", label: "Đăng ký học", icon: ClipboardCheck },
        { href: "/admin/grades", label: "Điểm số", icon: Trophy },
        { href: "/admin/graduation-requirements", label: "Tốt nghiệp", icon: ShieldCheck },
      ],
    },
    {
      title: "Quản lý tài chính",
      items: [
        { href: "/admin/tuitions", label: "Học phí", icon: CreditCard },
        { href: "/admin/tuition-payments", label: "Thanh toán", icon: HandCoins },
        { href: "/admin/records", label: "Học bổng", icon: WalletCards },
      ],
    },
    {
      title: "Báo cáo thống kê",
      items: [
        { href: "/admin/statistics", label: "Báo cáo học tập", icon: BarChart3 },
        { href: "/admin/statistics", label: "Báo cáo tài chính", icon: BarChart3 },
      ],
    },
  ], []);

  const activeGroupTitle = useMemo(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some(
        (item) =>
          pathname === item.href ||
          (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`))
      )
    );

    return activeGroup?.title || navGroups[0]?.title || "";
  }, [pathname, navGroups]);

  const displayedOpenGroup = openGroup || activeGroupTitle;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#eff3f8_0%,_#eef2f7_42%,_#e7edf5_100%)]">
      <aside className="sidebar-shell fixed inset-y-0 left-0 hidden w-72 flex-col xl:flex">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">
              Admin panel
            </p>
            <h1 className="mt-2 text-xl font-bold text-white">Bảng điều khiển quản trị</h1>
            <p className="mt-2 text-sm text-slate-300">
              Quản lý dữ liệu học vụ, học phí và báo cáo trong một giao diện thống nhất.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {navGroups.map((group) => {
            const expanded = displayedOpenGroup === group.title;
            const groupActive = activeGroupTitle === group.title;

            return (
              <div
                key={group.title}
                className={`rounded-2xl border transition ${
                  groupActive
                    ? "border-cyan-300/40 bg-white/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenGroup((current) => (current === group.title ? "" : group.title))}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/80 transition hover:text-white"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`}
                  />
                </button>

                {expanded ? (
                  <div className="space-y-1.5 px-2 pb-3">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href ||
                        (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`));

                      return (
                        <button
                          key={`${group.title}-${item.label}`}
                          onClick={() => router.push(item.href)}
                          className={`sidebar-link ${active ? "sidebar-link-active border-l-4 border-cyan-300 pl-2.5" : ""}`}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-500"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-h-screen xl:ml-72">
        <header className="page-header border-b border-slate-200/80 bg-white/74">
          <div className="page-container py-4">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/80 bg-white/82 px-5 py-4 shadow-[0_22px_55px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700/70">
                  Hệ thống quản trị
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Bảng điều khiển quản trị
                </h2>
              </div>

              <div className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm">
                Xin chào, {authUser?.username || authUser?.full_name || "admin"}
              </div>
            </div>
          </div>
        </header>

        <main className="page-container py-8">
          <div className="rounded-[2rem] border border-white/70 bg-white/34 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
