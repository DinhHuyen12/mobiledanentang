"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, GraduationCap, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getCollection } from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

type RequirementItem = {
  id: number;
  program_id?: number;
  program_code?: string;
  program_name?: string;
  min_cumulative_gpa?: number;
  min_earned_credits?: number;
  max_failed_subjects?: number;
  required_english_level?: string;
  required_it_level?: string;
  status?: string;
};

type ProgramOption = {
  id: number;
  code?: string;
  name?: string;
};

type StudentOption = {
  id: number;
  full_name?: string;
  username?: string;
};

type RequirementForm = {
  program_id: number;
  min_cumulative_gpa: number;
  min_earned_credits: number;
  max_failed_subjects: number;
  required_english_level: string;
  required_it_level: string;
  status: string;
};

type EvaluationResponse = {
  student_program?: {
    student_name?: string;
    program_name?: string;
    program_code?: string;
    expected_graduation_date?: string;
    status?: string;
  };
  summary?: {
    cumulative_gpa?: number;
    earned_credits?: number;
    total_failed_subjects?: number;
    total_missing_required_subjects?: number;
  };
  graduation_requirements?: {
    min_cumulative_gpa?: number;
    min_earned_credits?: number;
    max_failed_subjects?: number;
    required_english_level?: string;
    required_it_level?: string;
  };
  eligibility_checks?: Array<{
    label?: string;
    met?: boolean;
    actual?: string | number | null;
    required?: string | number | null;
  }>;
  missing_required_subject_list?: Array<{
    subject_code?: string;
    subject_name?: string;
  }>;
  is_eligible_for_graduation?: boolean;
};

const initialForm: RequirementForm = {
  program_id: 0,
  min_cumulative_gpa: 2,
  min_earned_credits: 0,
  max_failed_subjects: 0,
  required_english_level: "",
  required_it_level: "",
  status: "active",
};

function ModalFrame({
  open,
  title,
  submitLabel,
  submitting,
  children,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  submitting: boolean;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-4 p-6">{children}</div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Huy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {submitting ? "Dang luu..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminGraduationRequirementsPage() {
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RequirementForm>(initialForm);

  useToastMessage(error, "error");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [requirementsRes, programsRes, studentsRes] = await Promise.all([
        api.get("/graduation-requirements"),
        api.get("/training-programs"),
        api.get("/student-info"),
      ]);
      setRequirements(getCollection(requirementsRes.data) as RequirementItem[]);
      setPrograms(getCollection(programsRes.data) as ProgramOption[]);
      setStudents(getCollection(studentsRes.data) as StudentOption[]);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Khong tai duoc dieu kien tot nghiep");
      } else {
        setError("Khong tai duoc dieu kien tot nghiep");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRequirements = useMemo(() => {
    const normalized = keyword.toLowerCase();
    return requirements.filter((item) =>
      [item.program_name, item.program_code, item.required_english_level, item.required_it_level]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(normalized))
    );
  }, [keyword, requirements]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleSubmit = async () => {
    if (!formData.program_id) {
      toast.error("Vui long chon chuong trinh dao tao");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        program_id: Number(formData.program_id),
        min_cumulative_gpa: Number(formData.min_cumulative_gpa || 0),
        min_earned_credits: Number(formData.min_earned_credits || 0),
        max_failed_subjects: Number(formData.max_failed_subjects || 0),
        required_english_level: formData.required_english_level.trim() || null,
        required_it_level: formData.required_it_level.trim() || null,
        status: formData.status.trim(),
      };

      if (editingId) {
        await api.put(`/graduation-requirements/${editingId}`, payload);
        toast.success("Cap nhat dieu kien tot nghiep thanh cong");
      } else {
        await api.post("/graduation-requirements", payload);
        toast.success("Them dieu kien tot nghiep thanh cong");
      }

      closeModal();
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Luu dieu kien tot nghiep that bai");
      } else {
        toast.error("Luu dieu kien tot nghiep that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Ban co chac muon xoa dieu kien tot nghiep nay khong?")) return;
    try {
      await api.delete(`/graduation-requirements/${id}`);
      toast.success("Xoa dieu kien tot nghiep thanh cong");
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Xoa dieu kien tot nghiep that bai");
      } else {
        toast.error("Xoa dieu kien tot nghiep that bai");
      }
    }
  };

  const openEdit = (item: RequirementItem) => {
    setEditingId(item.id);
    setFormData({
      program_id: Number(item.program_id || 0),
      min_cumulative_gpa: Number(item.min_cumulative_gpa || 0),
      min_earned_credits: Number(item.min_earned_credits || 0),
      max_failed_subjects: Number(item.max_failed_subjects || 0),
      required_english_level: item.required_english_level || "",
      required_it_level: item.required_it_level || "",
      status: item.status || "active",
    });
    setModalOpen(true);
  };

  const handleEvaluate = async () => {
    if (!selectedStudentId) {
      toast.error("Vui long chon sinh vien de danh gia");
      return;
    }

    try {
      setEvaluating(true);
      const res = await api.get("/graduation-requirements/evaluate", {
        params: { student_id: selectedStudentId },
      });
      setEvaluation(res.data as EvaluationResponse);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Khong danh gia duoc tot nghiep");
      } else {
        toast.error("Khong danh gia duoc tot nghiep");
      }
      setEvaluation(null);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">
            Graduation Requirements
          </p>
          <h1 className="mt-3 text-3xl font-bold">Dieu kien tot nghiep</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/80">
            Quan ly bo dieu kien tot nghiep va danh gia tien do cua tung sinh vien.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tong bo dieu kien</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{requirements.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tong CTDT</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{programs.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tong sinh vien</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{students.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Ket qua danh gia</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {evaluation?.is_eligible_for_graduation ? "Dat" : evaluation ? "Chua dat" : "--"}
            </p>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Danh sach dieu kien</h2>
                <p className="text-sm text-slate-500">
                  Tao, sua va xoa bo dieu kien theo chuong trinh.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Them dieu kien
              </button>
            </div>

            <div className="relative mb-5">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tim theo chuong trinh, ngoai ngu, tin hoc..."
                className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4"
              />
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">Dang tai du lieu...</div>
              ) : filteredRequirements.length > 0 ? (
                filteredRequirements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.program_name || "-"} {item.program_code ? `(${item.program_code})` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span>GPA toi thieu: {item.min_cumulative_gpa ?? 0}</span>
                          <span>Tin chi toi thieu: {item.min_earned_credits ?? 0}</span>
                          <span>Mon rot toi da: {item.max_failed_subjects ?? 0}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                          <span>Ngoai ngu: {item.required_english_level || "Khong yeu cau"}</span>
                          <span>Tin hoc: {item.required_it_level || "Khong yeu cau"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.status || "-"}
                        </span>
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Chua co bo dieu kien nao.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <GraduationCap size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Danh gia tot nghiep</h2>
                <p className="text-sm text-slate-500">
                  Chon sinh vien de kiem tra tinh trang dat dieu kien.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <select
                value={selectedStudentId || ""}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                className="h-12 flex-1 rounded-2xl border border-slate-200 px-4"
              >
                <option value="">Chon sinh vien</option>
                {students.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.full_name || item.username || `Student ${item.id}`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => void handleEvaluate()}
                disabled={evaluating}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                <CheckCircle2 size={16} />
                {evaluating ? "Dang danh gia..." : "Danh gia"}
              </button>
            </div>

            {evaluation ? (
              <div className="mt-6 space-y-4">
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    evaluation.is_eligible_for_graduation
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {evaluation.is_eligible_for_graduation
                    ? "Sinh vien da dat dieu kien tot nghiep."
                    : "Sinh vien chua dat day du dieu kien tot nghiep."}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Sinh vien</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {evaluation.student_program?.student_name || "-"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {evaluation.student_program?.program_name || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Tong ket</p>
                    <p className="mt-2 text-sm text-slate-700">
                      GPA: {evaluation.summary?.cumulative_gpa ?? 0}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Tin chi dat: {evaluation.summary?.earned_credits ?? 0}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Mon rot: {evaluation.summary?.total_failed_subjects ?? 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">Kiem tra tung dieu kien</h3>
                  <div className="mt-3 space-y-2">
                    {(evaluation.eligibility_checks || []).map((item, index) => (
                      <div
                        key={`${item.label || "check"}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{item.label || "Dieu kien"}</p>
                          <p className="text-sm text-slate-500">
                            Hien tai: {item.actual ?? "-"} | Yeu cau: {item.required ?? "-"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.met
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {item.met ? "Dat" : "Chua dat"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">Mon hoc con thieu</h3>
                  {(evaluation.missing_required_subject_list || []).length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {evaluation.missing_required_subject_list?.map((item, index) => (
                        <span
                          key={`${item.subject_code || "subject"}-${index}`}
                          className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                        >
                          {(item.subject_code || "-") + " - " + (item.subject_name || "-")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Khong con mon bat buoc nao bi thieu.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Chua co ket qua danh gia.
              </div>
            )}
          </div>
        </section>
      </div>

      <ModalFrame
        open={modalOpen}
        title={editingId ? "Cap nhat dieu kien tot nghiep" : "Them dieu kien tot nghiep"}
        submitLabel={editingId ? "Cap nhat" : "Tao moi"}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={formData.program_id || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, program_id: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chon chuong trinh</option>
            {programs.map((item) => (
              <option key={item.id} value={item.id}>
                {(item.name || `Program ${item.id}`) + (item.code ? ` - ${item.code}` : "")}
              </option>
            ))}
          </select>
          <select
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-xl border px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="number"
            step="0.1"
            min={0}
            max={4}
            value={formData.min_cumulative_gpa}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, min_cumulative_gpa: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="GPA toi thieu"
          />
          <input
            type="number"
            min={0}
            value={formData.min_earned_credits}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, min_earned_credits: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Tin chi toi thieu"
          />
          <input
            type="number"
            min={0}
            value={formData.max_failed_subjects}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, max_failed_subjects: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Mon rot toi da"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={formData.required_english_level}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, required_english_level: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Yeu cau ngoai ngu"
          />
          <input
            value={formData.required_it_level}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, required_it_level: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Yeu cau tin hoc"
          />
        </div>
      </ModalFrame>
    </>
  );
}
