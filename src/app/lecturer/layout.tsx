"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  BookMarked,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  UsersRound,
  UserRound,
} from "lucide-react";
import {
  clearAuthToken,
  getAuthUser,
  getDefaultRouteByRole,
  isLecturerUser,
} from "@/lib/auth";

export default function LecturerLayout({
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

    if (!isLecturerUser(authUser)) {
      router.replace(getDefaultRouteByRole(authUser.role));
    }
  }, [router]);

  const handleLogout = () => {
    clearAuthToken();
    router.replace("/login");
  };

  const navGroups = [
    {
      title: "Thong tin",
      items: [
        { href: "/lecturer", label: "Tong quan", icon: LayoutDashboard },
        { href: "/lecturer/profile", label: "Ho so", icon: UserRound },
      ],
    },
    {
      title: "Xem lich day",
      items: [
        { href: "/lecturer/schedules", label: "Lich theo tuan", icon: CalendarDays },
        { href: "/lecturer/schedules", label: "Lich theo ky", icon: CalendarClock },
        { href: "/lecturer/schedules", label: "Phong hoc", icon: BookOpenCheck },
      ],
    },
    {
      title: "Hoc phan sinh vien",
      items: [
        { href: "/lecturer/course-sections", label: "Danh sach lop", icon: NotebookPen },
        { href: "/lecturer/course-sections", label: "Danh sach SV", icon: UsersRound },
        { href: "/lecturer/course-sections", label: "Diem danh / Nhap diem", icon: BookMarked },
      ],
    },
  ];

  return (
    <div className="page-shell relative overflow-hidden bg-[linear-gradient(180deg,_#f4f8f6_0%,_#edf3ef_26%,_#eef2f6_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_top_left,_rgba(5,150,105,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.14),_transparent_18%)]" />

      <header className="relative z-10 border-b border-emerald-950/10 bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
        <div className="page-container py-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 px-5 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-lime-300 p-3 text-slate-950 shadow-lg shadow-emerald-950/20">
                    <BookMarked size={22} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Cong giang vien</p>
                    <p className="text-sm text-slate-300">
                      Khong gian giang day danh cho giang vien
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/16 hover:shadow-md"
                >
                  <LogOut size={16} />
                  Dang xuat
                </button>
              </div>

              <nav className="grid gap-3 lg:grid-cols-3">
                {navGroups.map((group) => (
                  <div key={group.title} className="rounded-3xl border border-white/10 bg-white/6 p-3">
                    <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100/70">
                      {group.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active =
                          item.href === "/lecturer"
                            ? pathname === item.href
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={`${group.title}-${item.label}`}
                            href={item.href}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition duration-200 ${
                              active
                                ? "border-emerald-300/20 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-950/20"
                                : "border-white/10 bg-white/8 text-slate-200 hover:-translate-y-0.5 hover:bg-white/12 hover:text-white"
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
