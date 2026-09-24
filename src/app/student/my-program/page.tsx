"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useToastMessage } from "@/hooks/use-toast-message";

type Assignment = {
  start_date?: string;
  expected_graduation_date?: string;
  status?: string;
  program_name?: string;
  program_code?: string;
  faculty_name?: string;
  total_credits_required?: number;
  elective_credits_required?: number;
};

type CurriculumItem = {
  id: number;
  subject_id?: number;
  subject_code?: string;
  subject_name?: string;
  credits?: number;
  subject_type?: string;
  recommended_semester?: number;
  min_score_required?: number;
  display_order?: number;
  total_hours?: number;
  elearning?: boolean;
  include_in_gpa?: boolean;
};

type CurriculumSemester = {
  semester: number;
  subjects: CurriculumItem[];
};

type ProgramResponse = {
  assignment?: Assignment;
  program?: {
    code?: string;
    name?: string;
    faculty_name?: string;
    total_credits_required?: number;
    elective_credits_required?: number;
    description?: string;
    status?: string;
  };
  curriculum?: CurriculumItem[];
  curriculum_by_semester?: Array<{
    semester?: number;
    subjects?: CurriculumItem[];
  }>;
  non_gpa_subjects?: CurriculumItem[];
};

function formatDate(value?: string) {
  return value ? String(value).slice(0, 10) : "-";
}

function formatBooleanTag(value?: boolean) {
  return value ? "Có" : "Không";
}

function sortCurriculum(items: CurriculumItem[]) {
  return [...items].sort((a, b) => {
    const semesterDiff = (a.recommended_semester ?? 0) - (b.recommended_semester ?? 0);
    if (semesterDiff !== 0) return semesterDiff;

    const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
    if (orderDiff !== 0) return orderDiff;

    return (a.id ?? 0) - (b.id ?? 0);
  });
}

function normalizeSemesters(data: ProgramResponse | null) {
  const grouped = data?.curriculum_by_semester;

  if (Array.isArray(grouped) && grouped.length > 0) {
    return grouped
      .map((semesterGroup) => ({
        semester: Number(semesterGroup.semester || 0),
        subjects: sortCurriculum(semesterGroup.subjects || []),
      }))
      .filter((semesterGroup) => semesterGroup.semester > 0 && semesterGroup.subjects.length > 0)
      .sort((a, b) => a.semester - b.semester);
  }

  const fallback = sortCurriculum(data?.curriculum || []);
  const semesterMap = new Map<number, CurriculumItem[]>();

  for (const item of fallback) {
    const semester = Number(item.recommended_semester || 0);
    if (!semesterMap.has(semester)) {
      semesterMap.set(semester, []);
    }
    semesterMap.get(semester)?.push(item);
  }

  return Array.from(semesterMap.entries())
    .filter(([semester, subjects]) => semester > 0 && subjects.length > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([semester, subjects]) => ({ semester, subjects }));
}

function normalizeNonGpaSubjects(data: ProgramResponse | null) {
  if (Array.isArray(data?.non_gpa_subjects)) {
    return sortCurriculum(data.non_gpa_subjects);
  }

  return sortCurriculum((data?.curriculum || []).filter((item) => item.include_in_gpa === false));
}

export default function StudentMyProgramPage() {
  const [data, setData] = useState<ProgramResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");

  useToastMessage(error, "error");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/training-programs/my-program");
      setData(res.data as ProgramResponse);
      setError("");
      setEmptyMessage("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || "Không tải được chương trình đào tạo";
        if (err.response?.status === 404 || message.toLowerCase().includes("khong tim thay")) {
          setData(null);
          setEmptyMessage("Sinh viên này chưa được gán chương trình đào tạo.");
          setError("");
        } else {
          setError(message);
          setEmptyMessage("");
        }
      } else if (err instanceof Error) {
        setError(err.message);
        setEmptyMessage("");
      } else {
        setError("Không tải được chương trình đào tạo");
        setEmptyMessage("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const semesters = useMemo<CurriculumSemester[]>(() => normalizeSemesters(data), [data]);
  const nonGpaSubjects = useMemo(() => normalizeNonGpaSubjects(data), [data]);
  const totalSubjects = useMemo(
    () => semesters.reduce((sum, semester) => sum + semester.subjects.length, 0),
    [semesters]
  );

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải chương trình đào tạo...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!data?.program || emptyMessage) {
    return (
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">Training Program</p>
          <h1 className="mt-3 text-3xl font-bold">Chương trình đào tạo</h1>
          <p className="mt-2 text-sm text-white/80">
            Theo dõi chương trình đào tạo và khung môn học của bạn.
          </p>
        </section>

        <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Chưa có chương trình đào tạo</h2>
          <p className="mt-3 text-sm text-slate-500">
            {emptyMessage || "Sinh viên này chưa được gán chương trình đào tạo."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Training Program</p>
        <h1 className="mt-3 text-3xl font-bold">{data.program.name || "Chương trình đào tạo"}</h1>
        <p className="mt-2 text-sm text-white/80">
          {data.program.code || "-"} | {data.program.faculty_name || "-"}
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Mã CTĐT</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data.program.code || "-"}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Tổng tín chỉ</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {data.program.total_credits_required ?? 0}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Học kỳ có khung</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{semesters.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Môn không tính GPA</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{nonGpaSubjects.length}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Thông tin phân chương trình</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <span className="text-sm text-slate-500">Ngày bắt đầu</span>
            <p className="mt-2 font-semibold text-slate-900">
              {formatDate(data.assignment?.start_date)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <span className="text-sm text-slate-500">Dự kiến tốt nghiệp</span>
            <p className="mt-2 font-semibold text-slate-900">
              {formatDate(data.assignment?.expected_graduation_date)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <span className="text-sm text-slate-500">Trạng thái</span>
            <p className="mt-2 font-semibold capitalize text-slate-900">
              {data.assignment?.status || data.program.status || "-"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <span className="text-sm text-slate-500">Tổng môn trong khung</span>
            <p className="mt-2 font-semibold text-slate-900">{totalSubjects}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          {data.program.description || "Chưa có mô tả chương trình."}
        </p>
      </section>

      {nonGpaSubjects.length > 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Môn học không tính GPA</h2>
              <p className="mt-2 text-sm text-slate-600">
                Các môn này vẫn nằm trong khung chương trình nhưng không được đưa vào GPA tích
                lũy.
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-700">
              {nonGpaSubjects.length} môn
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {nonGpaSubjects.map((item) => (
              <span
                key={`non-gpa-${item.id}`}
                className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800"
              >
                {(item.subject_code || "-") + " - " + (item.subject_name || "-")}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Khung chương trình theo học kỳ</h2>
            <p className="mt-1 text-sm text-slate-500">
              Backend mới sẽ nhóm sẵn theo học kỳ; trang này vẫn tự fallback nếu server chưa
              restart.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700">
              GPA: tính vào điểm tích lũy
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
              Non-GPA: không tính vào GPA
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {semesters.length > 0 ? (
            semesters.map((semesterGroup) => (
              <div key={`semester-${semesterGroup.semester}`} className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
                  <div>
                    <h3 className="text-lg font-semibold">Học kỳ {semesterGroup.semester}</h3>
                    <p className="text-sm text-slate-300">
                      {semesterGroup.subjects.length} môn học
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    {semesterGroup.subjects.reduce((sum, item) => sum + Number(item.credits || 0), 0)} TC
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">STT</th>
                        <th className="px-4 py-3 font-semibold">Mã môn</th>
                        <th className="px-4 py-3 font-semibold">Tên môn học</th>
                        <th className="px-4 py-3 font-semibold">Loại</th>
                        <th className="px-4 py-3 font-semibold">TC</th>
                        <th className="px-4 py-3 font-semibold">Tổng giờ</th>
                        <th className="px-4 py-3 font-semibold">E-learning</th>
                        <th className="px-4 py-3 font-semibold">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {semesterGroup.subjects.map((item, index) => {
                        const includeInGpa = item.include_in_gpa !== false;

                        return (
                          <tr
                            key={item.id}
                            className={includeInGpa ? "text-slate-700" : "bg-amber-50/50 text-slate-700"}
                          >
                            <td className="px-4 py-3">{item.display_order ?? index + 1}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {item.subject_code || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{item.subject_name || "-"}</div>
                              {typeof item.min_score_required === "number" ? (
                                <div className="mt-1 text-xs text-slate-500">
                                  Điểm tối thiểu: {item.min_score_required}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                {item.subject_type || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3">{item.credits ?? 0}</td>
                            <td className="px-4 py-3">{item.total_hours ?? "-"}</td>
                            <td className="px-4 py-3">{formatBooleanTag(item.elearning)}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  includeInGpa
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {includeInGpa ? "Tính GPA" : "Không tính"}
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
              Chưa có môn học trong chương trình.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
