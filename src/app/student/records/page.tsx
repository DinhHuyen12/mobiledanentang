"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CalendarDays,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import { useToastMessage } from "@/hooks/use-toast-message";
import { getCollection, loadStudentPortalData } from "@/lib/student-portal";
import {
  DisciplinaryActionItem,
  ScholarshipAwardItem,
  formatScholarshipMoney,
  formatStudentRecordDate,
  getDisciplinaryLevelClassName,
  getDisciplinaryStatusLabel,
  getScholarshipStatusClassName,
  getScholarshipStatusLabel,
} from "@/lib/student-records";

export default function StudentRecordsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");
  const [scholarships, setScholarships] = useState<ScholarshipAwardItem[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryActionItem[]>([]);

  useToastMessage(error, "error");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [portalData, scholarshipsRes, disciplinaryRes] = await Promise.all([
        loadStudentPortalData(),
        api.get("/scholarships/awards/me"),
        api.get("/disciplinary-actions/me"),
      ]);

      const scholarshipList = getCollection(scholarshipsRes.data) as ScholarshipAwardItem[];
      const disciplinaryList = getCollection(disciplinaryRes.data) as DisciplinaryActionItem[];

      setStudentName(
        portalData.studentInfo?.full_name || portalData.studentInfo?.username || "Sinh viên"
      );
      setScholarships(
        [...scholarshipList].sort((left, right) =>
          String(right.awarded_date || "").localeCompare(String(left.awarded_date || ""))
        )
      );
      setDisciplinaryActions(
        [...disciplinaryList].sort((left, right) =>
          String(right.decision_date || "").localeCompare(String(left.decision_date || ""))
        )
      );
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được mục kỷ luật và khen thưởng");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được mục kỷ luật và khen thưởng");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalScholarshipAmount = useMemo(
    () => scholarships.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [scholarships]
  );

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải kỷ luật và khen thưởng...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-indigo-700 to-sky-700 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">
          Kỷ luật và khen thưởng
        </p>
        <h1 className="mt-3 text-3xl font-bold">{studentName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Theo dõi học bổng đã được cấp và các quyết định kỷ luật đang lưu trong hệ
          thống backend.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Award size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Số học bổng</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{scholarships.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng giá trị học bổng</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {formatScholarshipMoney(totalScholarshipAmount)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Quyết định kỷ luật</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {disciplinaryActions.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <Award size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Khen thưởng - Học bổng</h2>
            <p className="text-sm text-slate-500">
              Dữ liệu lấy từ `GET /api/scholarships/awards/me`.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {scholarships.length > 0 ? (
            scholarships.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {item.scholarship_name || "Học bổng"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        Ngày cấp: {formatStudentRecordDate(item.awarded_date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles size={14} className="text-slate-400" />
                        Giá trị: {formatScholarshipMoney(item.amount)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {item.note || "Chưa có ghi chú cho học bổng này."}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getScholarshipStatusClassName(item.status)}`}
                  >
                    {getScholarshipStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Hiện chưa có học bổng hoặc hình thức khen thưởng nào được ghi nhận.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Kỷ luật</h2>
            <p className="text-sm text-slate-500">
              Dữ liệu lấy từ `GET /api/disciplinary-actions/me`.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {disciplinaryActions.length > 0 ? (
            disciplinaryActions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {item.title || "Quyết định kỷ luật"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        Ngày quyết định: {formatStudentRecordDate(item.decision_date)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getDisciplinaryLevelClassName(item.level)}`}
                      >
                        {item.level || "Chưa rõ mức độ"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      {item.description || "Chưa có mô tả chi tiết."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Lớp: {item.class_name || "-"}</span>
                      <span>Học kỳ: {item.semester_name || "-"}</span>
                      <span>Người duyệt: {item.decided_by_name || "-"}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {getDisciplinaryStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Hiện chưa có quyết định kỷ luật nào được ghi nhận.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/10 p-3 text-white">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Ghi chú</h2>
            <p className="mt-2 text-sm text-slate-300">
              Backend hiện có dữ liệu học bổng và kỷ luật. Phần “khen thưởng” riêng chưa có
              module độc lập, nên hiện tại mình đang hiển thị phần khen thưởng thông qua học
              bổng được cấp cho sinh viên.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
