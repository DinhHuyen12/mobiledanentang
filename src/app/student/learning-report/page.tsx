"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, Download, FileText, Printer, Search, TrendingUp } from "lucide-react";
import {
  EnrollmentItem,
  GradeItem,
  StudentInfo,
  getAverageScore,
  loadStudentPortalData,
} from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

type ReportRow = GradeItem & {
  semester_name?: string;
  enrollment_status?: string;
};

type ReportState = {
  studentInfo: StudentInfo | null;
  enrollments: EnrollmentItem[];
  grades: GradeItem[];
};

const EMPTY_REPORT: ReportState = {
  studentInfo: null,
  enrollments: [],
  grades: [],
};

function getPassStatus(totalScore?: number, letterGrade?: string) {
  const normalizedLetter = String(letterGrade || "").trim().toUpperCase();
  const normalizedScore = Number(totalScore ?? 0);

  if (normalizedLetter === "F" || normalizedScore < 5) {
    return {
      label: "Chưa đạt",
      className: "bg-rose-50 text-rose-700",
    };
  }

  return {
    label: "Đạt",
    className: "bg-emerald-50 text-emerald-700",
  };
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function escapeCsvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function StudentLearningReportPage() {
  const [report, setReport] = useState<ReportState>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useToastMessage(error, "error");

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await loadStudentPortalData();
      setReport({
        studentInfo: data.studentInfo,
        enrollments: data.enrollments,
        grades: data.grades,
      });
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được báo cáo học tập");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được báo cáo học tập");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const rows = useMemo<ReportRow[]>(() => {
    const enrollmentsById = new Map(
      report.enrollments.map((item) => [Number(item.id), item])
    );

    return report.grades.map((grade) => {
      const enrollment = enrollmentsById.get(Number(grade.enrollment_id));
      return {
        ...grade,
        semester_name: enrollment?.semester_name || "",
        enrollment_status: enrollment?.status || "",
        subject_name: grade.subject_name || enrollment?.subject_name || "-",
      };
    });
  }, [report.enrollments, report.grades]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return rows;

    return rows.filter((item) => {
      return (
        String(item.subject_name || "").toLowerCase().includes(normalizedKeyword) ||
        String(item.semester_name || "").toLowerCase().includes(normalizedKeyword) ||
        String(item.letter_grade || "").toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [keyword, rows]);

  const averageScore = useMemo(() => getAverageScore(filteredRows), [filteredRows]);
  const passedCount = useMemo(
    () =>
      filteredRows.filter(
        (item) => getPassStatus(item.total_score, item.letter_grade).label === "Đạt"
      ).length,
    [filteredRows]
  );
  const failedCount = filteredRows.length - passedCount;
  const highestScore = useMemo(
    () => Math.max(0, ...filteredRows.map((item) => Number(item.total_score || 0))),
    [filteredRows]
  );

  const groupedBySemester = useMemo(() => {
    const semesterMap = new Map<string, ReportRow[]>();

    filteredRows.forEach((item) => {
      const semester = item.semester_name || "Chưa có học kỳ";
      const items = semesterMap.get(semester) || [];
      items.push(item);
      semesterMap.set(semester, items);
    });

    return Array.from(semesterMap.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    );
  }, [filteredRows]);

  const exportCsv = () => {
    if (filteredRows.length === 0) return;

    const header = [
      "Sinh viên",
      "Lớp",
      "Học kỳ",
      "Môn học",
      "Chuyên cần",
      "Giữa kỳ",
      "Cuối kỳ",
      "Tổng điểm",
      "Điểm chữ",
      "Kết quả",
    ];

    const body = filteredRows.map((item) => {
      const status = getPassStatus(item.total_score, item.letter_grade);
      return [
        report.studentInfo?.full_name || report.studentInfo?.username || "",
        report.studentInfo?.class_name || "",
        item.semester_name || "",
        item.subject_name || "",
        item.attendance_score ?? 0,
        item.midterm_score ?? 0,
        item.final_score ?? 0,
        item.total_score ?? 0,
        item.letter_grade || "",
        status.label,
      ];
    });

    const csv = [header, ...body]
      .map((line) => line.map(escapeCsvCell).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-hoc-tap-${report.studentInfo?.username || "sinh-vien"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải báo cáo học tập...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-slate-900 to-cyan-700 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Learning Report</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo học tập</h1>
            <p className="mt-2 text-sm text-white/80">
              Tổng hợp kết quả học tập từ dữ liệu điểm và học phần đã đăng ký.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/18"
            >
              <Printer size={16} />
              In báo cáo
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Sinh viên</p>
            <FileText size={18} className="text-cyan-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {report.studentInfo?.full_name || report.studentInfo?.username || "-"}
          </p>
          <p className="mt-1 text-sm text-slate-500">{report.studentInfo?.class_name || "-"}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Điểm trung bình</p>
            <Award size={18} className="text-amber-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{averageScore}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Môn đã đạt</p>
            <TrendingUp size={18} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">{passedCount}</p>
          <p className="mt-1 text-sm text-slate-500">{failedCount} môn chưa đạt</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Điểm cao nhất</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatNumber(highestScore)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{filteredRows.length} dòng báo cáo</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Chi tiết kết quả học tập</h2>
            <p className="mt-1 text-sm text-slate-500">
              Dữ liệu lấy từ API grades hiện có, không dùng endpoint /reports riêng.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo học kỳ, môn học, điểm chữ..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>
        </div>

        <div className="space-y-6">
          {groupedBySemester.length > 0 ? (
            groupedBySemester.map(([semester, items]) => (
              <div key={semester} className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="flex flex-col gap-2 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{semester}</h3>
                    <p className="text-sm text-slate-500">{items.length} môn học có điểm</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    ĐTB học kỳ: {getAverageScore(items)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-white text-left font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Môn học</th>
                        <th className="px-5 py-4">Chuyên cần</th>
                        <th className="px-5 py-4">Giữa kỳ</th>
                        <th className="px-5 py-4">Cuối kỳ</th>
                        <th className="px-5 py-4">Tổng điểm</th>
                        <th className="px-5 py-4">Điểm chữ</th>
                        <th className="px-5 py-4">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((item) => {
                        const status = getPassStatus(item.total_score, item.letter_grade);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {item.subject_name || "-"}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {item.attendance_score ?? 0}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {item.midterm_score ?? 0}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {item.final_score ?? 0}
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {item.total_score ?? 0}
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                                {item.letter_grade || "-"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Chưa có dữ liệu điểm để lập báo cáo học tập.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
