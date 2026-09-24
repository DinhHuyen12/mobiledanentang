"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarRange,
  CreditCard,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function HomePage() {
  const portalCards = useMemo(
    () => [
      {
        title: "Cổng sinh viên",
        description: "Dang ky hoc phan, xem lich hoc, hoc phi, diem va thanh toan VNPAY.",
        href: "/login",
        icon: UserRound,
        accent: "from-sky-500 to-cyan-500",
      },
      {
        title: "Cổng giảng viên",
        description: "Quan ly hoc phan phu trach, xem roster, nhap diem va theo doi lich day.",
        href: "/login",
        icon: BookOpenCheck,
        accent: "from-emerald-500 to-teal-500",
      },
      {
        title: "Cổng quản trị",
        description: "Quan ly nguoi dung, mon hoc, hoc ky, hoc phi, lich hoc va toan bo danh muc.",
        href: "/login",
        icon: ShieldCheck,
        accent: "from-amber-500 to-orange-500",
      },
    ],
    []
  );

  const featureCards = [
    {
      title: "Dang ky hoc phan",
      description: "Sinh vien dang ky, xem hoc phan, doi chieu lich va tien quyet tren mot giao dien chung.",
      icon: CalendarRange,
    },
    {
      title: "Cham diem truc tiep",
      description: "Giang vien nhap diem chuyen can, giua ky, cuoi ky va xem tong diem duoc tinh tu dong.",
      icon: BookOpenCheck,
    },
    {
      title: "Thanh toan hoc phi",
      description: "Theo doi cong no, lich su giao dich va thanh toan qua luong VNPAY da duoc noi vao he thong.",
      icon: CreditCard,
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.16),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-2xl">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.24),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.20),_transparent_32%)] px-8 py-10 md:px-10 md:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.3fr,0.9fr] lg:items-end">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-white/80">
                  Hệ thống quản lý học tập
                </span>
                <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
                  Trang chung của đồ án quản lý sinh viên, giảng viên và học phí.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                  Khi mở `localhost:3000`, bạn sẽ vào thẳng trang tổng quan của hệ thống thay vì màn hình mặc định của Next.js.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
                  >
                    Đăng nhập hệ thống
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Tạo tài khoản mới
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Trạng thái truy cập</p>
                  <p className="mt-2 text-2xl font-bold text-white">Sẵn sàng demo hệ thống</p>
                </div>
                <div className="grid gap-3 text-sm text-slate-200">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    Sinh viên: đăng ký học, lịch học, điểm, học phí, VNPAY.
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    Giảng viên: học phần chi tiết, danh sách lớp, nhập điểm, lịch dạy.
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    Quản trị: bảng điều khiển, danh mục, học phí, thanh toán, lịch và phân quyền.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {portalCards.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`inline-flex rounded-2xl bg-gradient-to-r ${item.accent} p-3 text-white`}>
                  <Icon size={22} />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-slate-900">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  Mở khu vực
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mt-10 rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-100 md:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">
              Tính năng nổi bật
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              Một điểm vào chung cho toàn bộ bài đồ án
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Trang này được dùng làm điểm bắt đầu cho demo, giúp mở localhost là thấy ngay tổng quan hệ thống và đi vào từng portal nhanh hơn.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-[1.75rem] bg-slate-50 p-5">
                  <div className="inline-flex rounded-2xl bg-white p-3 text-sky-600 shadow-sm">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
