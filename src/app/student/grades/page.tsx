"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Search } from "lucide-react";
import { GradeItem, getAverageScore, loadStudentPortalData } from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useToastMessage(error, "error");

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadStudentPortalData();
      setGrades(data.grades);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được bảng điểm");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được bảng điểm");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const filteredGrades = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();
    return grades.filter((item) =>
      (item.subject_name || "").toLowerCase().includes(lowerKeyword) ||
      String(item.letter_grade || "").toLowerCase().includes(lowerKeyword)
    );
  }, [grades, keyword]);

  const averageScore = useMemo(() => getAverageScore(filteredGrades), [filteredGrades]);

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải bảng điểm...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">My Grades</p>
        <h1 className="mt-3 text-3xl font-bold">Bảng điểm của tôi</h1>
        <p className="mt-2 text-sm text-white/80">
          Xem tổng hợp điểm số và điểm chữ theo từng học phần.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Tổng môn đã có điểm</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{filteredGrades.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Điểm trung bình</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{averageScore}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Điểm chữ nổi bật</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {filteredGrades[0]?.letter_grade || "-"}
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo môn học hoặc điểm chữ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
            <Award size={16} />
            GPA tạm tính: {averageScore}
          </div>
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
                {filteredGrades.length > 0 ? (
                  filteredGrades.map((item) => (
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
                      Không có dữ liệu điểm phù hợp.
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
