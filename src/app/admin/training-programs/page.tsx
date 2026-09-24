"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookCopy,
  ClipboardPlus,
  Layers3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getCollection } from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

type ProgramItem = {
  id: number;
  faculty_id?: number;
  faculty_name?: string;
  code?: string;
  name?: string;
  total_credits_required?: number;
  elective_credits_required?: number;
  status?: string;
  description?: string;
};

type CurriculumItem = {
  id: number;
  program_id?: number;
  subject_id?: number;
  subject_code?: string;
  subject_name?: string;
  credits?: number;
  subject_type?: string;
  recommended_semester?: number;
  min_score_required?: number;
};

type FacultyOption = {
  id: number;
  name?: string;
};

type SubjectOption = {
  id: number;
  code?: string;
  name?: string;
  credits?: number;
};

type StudentOption = {
  id: number;
  full_name?: string;
  username?: string;
};

type ProgramForm = {
  faculty_id: number;
  code: string;
  name: string;
  total_credits_required: number;
  elective_credits_required: number;
  status: string;
  description: string;
};

type CurriculumForm = {
  subject_id: number;
  subject_type: string;
  recommended_semester: number;
  min_score_required: number;
};

type AssignmentForm = {
  student_id: number;
  start_date: string;
  expected_graduation_date: string;
  status: string;
};

const initialProgramForm: ProgramForm = {
  faculty_id: 0,
  code: "",
  name: "",
  total_credits_required: 0,
  elective_credits_required: 0,
  status: "active",
  description: "",
};

const initialCurriculumForm: CurriculumForm = {
  subject_id: 0,
  subject_type: "required",
  recommended_semester: 1,
  min_score_required: 4,
};

const initialAssignmentForm: AssignmentForm = {
  student_id: 0,
  start_date: "",
  expected_graduation_date: "",
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
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {submitting ? "Đang lưu..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTrainingProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [editingCurriculumId, setEditingCurriculumId] = useState<number | null>(null);

  const [programForm, setProgramForm] = useState(initialProgramForm);
  const [curriculumForm, setCurriculumForm] = useState(initialCurriculumForm);
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm);

  useToastMessage(error, "error");

  const fetchLookups = useCallback(async () => {
    try {
      setLoading(true);
      const [programsRes, facultiesRes, subjectsRes, studentsRes] = await Promise.all([
        api.get("/training-programs"),
        api.get("/faculties"),
        api.get("/subjects"),
        api.get("/student-info"),
      ]);

      const nextPrograms = getCollection(programsRes.data) as ProgramItem[];
      setPrograms(nextPrograms);
      setFaculties(getCollection(facultiesRes.data) as FacultyOption[]);
      setSubjects(getCollection(subjectsRes.data) as SubjectOption[]);
      setStudents(getCollection(studentsRes.data) as StudentOption[]);
      setSelectedProgramId((prev) => prev || nextPrograms[0]?.id || 0);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được chương trình đào tạo");
      } else {
        setError("Không tải được chương trình đào tạo");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgramDetail = useCallback(async (programId: number) => {
    if (!programId) {
      setCurriculum([]);
      return;
    }

    try {
      setDetailLoading(true);
      const res = await api.get(`/training-programs/${programId}`);
      const payload = res.data as
        | { curriculum?: CurriculumItem[]; data?: { curriculum?: CurriculumItem[] } }
        | CurriculumItem[];

      if (Array.isArray(payload)) {
        setCurriculum(payload);
      } else if (Array.isArray(payload?.curriculum)) {
        setCurriculum(payload.curriculum);
      } else if (Array.isArray(payload?.data?.curriculum)) {
        setCurriculum(payload.data.curriculum);
      } else {
        setCurriculum([]);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Không tải được khung chương trình");
      } else {
        toast.error("Không tải được khung chương trình");
      }
      setCurriculum([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  useEffect(() => {
    if (!selectedProgramId) return;
    void fetchProgramDetail(selectedProgramId);
  }, [fetchProgramDetail, selectedProgramId]);

  const selectedProgram = useMemo(
    () => programs.find((item) => item.id === selectedProgramId) || null,
    [programs, selectedProgramId]
  );

  const closeProgramModal = () => {
    setProgramModalOpen(false);
    setEditingProgramId(null);
    setProgramForm(initialProgramForm);
  };

  const closeCurriculumModal = () => {
    setCurriculumModalOpen(false);
    setEditingCurriculumId(null);
    setCurriculumForm(initialCurriculumForm);
  };

  const closeAssignmentModal = () => {
    setAssignmentModalOpen(false);
    setAssignmentForm(initialAssignmentForm);
  };

  const handleProgramSubmit = async () => {
    if (!programForm.faculty_id || !programForm.code.trim() || !programForm.name.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin chương trình");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        faculty_id: Number(programForm.faculty_id),
        code: programForm.code.trim(),
        name: programForm.name.trim(),
        total_credits_required: Number(programForm.total_credits_required || 0),
        elective_credits_required: Number(programForm.elective_credits_required || 0),
        status: programForm.status.trim(),
        description: programForm.description.trim(),
      };

      if (editingProgramId) {
        await api.put(`/training-programs/${editingProgramId}`, payload);
        toast.success("Cập nhật chương trình thành công");
      } else {
        await api.post("/training-programs", payload);
        toast.success("Tạo chương trình thành công");
      }

      closeProgramModal();
      await fetchLookups();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Lưu chương trình thất bại");
      } else {
        toast.error("Lưu chương trình thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCurriculumSubmit = async () => {
    if (!selectedProgramId || !curriculumForm.subject_id) {
      toast.error("Vui lòng chọn chương trình và môn học");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        program_id: Number(selectedProgramId),
        subject_id: Number(curriculumForm.subject_id),
        subject_type: curriculumForm.subject_type.trim(),
        recommended_semester: Number(curriculumForm.recommended_semester || 1),
        min_score_required: Number(curriculumForm.min_score_required || 4),
      };

      if (editingCurriculumId) {
        await api.put(`/training-programs/curriculum-subjects/${editingCurriculumId}`, payload);
        toast.success("Cập nhật môn học trong khung thành công");
      } else {
        await api.post("/training-programs/curriculum-subjects", payload);
        toast.success("Thêm môn học vào khung thành công");
      }

      closeCurriculumModal();
      await fetchProgramDetail(selectedProgramId);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Lưu khung chương trình thất bại");
      } else {
        toast.error("Lưu khung chương trình thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignStudent = async () => {
    if (!selectedProgramId || !assignmentForm.student_id || !assignmentForm.start_date) {
      toast.error("Vui lòng chọn sinh viên và ngày bắt đầu");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/training-programs/assign-student", {
        program_id: Number(selectedProgramId),
        student_id: Number(assignmentForm.student_id),
        start_date: assignmentForm.start_date,
        expected_graduation_date: assignmentForm.expected_graduation_date || null,
        status: assignmentForm.status.trim(),
      });
      toast.success("Gán chương trình cho sinh viên thành công");
      closeAssignmentModal();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Gán chương trình thất bại");
      } else {
        toast.error("Gán chương trình thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa chương trình này không?")) return;
    try {
      await api.delete(`/training-programs/${id}`);
      toast.success("Xóa chương trình thành công");
      if (selectedProgramId === id) {
        setSelectedProgramId(0);
        setCurriculum([]);
      }
      await fetchLookups();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Xóa chương trình thất bại");
      } else {
        toast.error("Xóa chương trình thất bại");
      }
    }
  };

  const handleDeleteCurriculum = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa môn học này khỏi khung chương trình không?")) return;
    try {
      await api.delete(`/training-programs/curriculum-subjects/${id}`);
      toast.success("Xóa môn học khỏi khung thành công");
      await fetchProgramDetail(selectedProgramId);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Xóa môn học thất bại");
      } else {
        toast.error("Xóa môn học thất bại");
      }
    }
  };

  const openEditProgram = (item: ProgramItem) => {
    setEditingProgramId(item.id);
    setProgramForm({
      faculty_id: Number(item.faculty_id || 0),
      code: item.code || "",
      name: item.name || "",
      total_credits_required: Number(item.total_credits_required || 0),
      elective_credits_required: Number(item.elective_credits_required || 0),
      status: item.status || "active",
      description: item.description || "",
    });
    setProgramModalOpen(true);
  };

  const openEditCurriculum = (item: CurriculumItem) => {
    setEditingCurriculumId(item.id);
    setCurriculumForm({
      subject_id: Number(item.subject_id || 0),
      subject_type: item.subject_type || "required",
      recommended_semester: Number(item.recommended_semester || 1),
      min_score_required: Number(item.min_score_required || 4),
    });
    setCurriculumModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-gradient-to-r from-violet-700 to-indigo-700 p-6 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">
            Chương trình đào tạo
          </p>
          <h1 className="mt-3 text-3xl font-bold">Chương trình đào tạo</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/80">
            Quản lý chương trình, khung môn học và gán chương trình cho sinh viên.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tổng chương trình</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{programs.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tổng môn trong khung</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{curriculum.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tổng khoa</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{faculties.length}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Tổng môn học</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{subjects.length}</p>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Danh sách chương trình</h2>
                <p className="text-sm text-slate-500">Tạo, sửa và xóa chương trình đào tạo.</p>
              </div>
              <button
                onClick={() => setProgramModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Thêm CTĐT
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">Đang tải chương trình...</div>
              ) : programs.length > 0 ? (
                programs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProgramId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedProgramId === item.id
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name || "-"}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.code || "-"} • {item.faculty_name || "-"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Tổng tín chỉ: {item.total_credits_required ?? 0} | Tự chọn:{" "}
                          {item.elective_credits_required ?? 0}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {item.status || "-"}
                        </span>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditProgram(item);
                          }}
                          className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700"
                        >
                          <Pencil size={16} />
                        </span>
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteProgram(item.id);
                          }}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700"
                        >
                          <Trash2 size={16} />
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Chưa có chương trình đào tạo nào.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedProgram?.name || "Chi tiết chương trình"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedProgram?.description || "Chọn một chương trình để xem thông tin chi tiết."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurriculumModalOpen(true)}
                    disabled={!selectedProgramId}
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <BookCopy size={16} />
                    Thêm môn vào khung
                  </button>
                  <button
                    onClick={() => setAssignmentModalOpen(true)}
                    disabled={!selectedProgramId}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <ClipboardPlus size={16} />
                    Gán cho sinh viên
                  </button>
                </div>
              </div>

              {selectedProgram ? (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Mã CTĐT</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {selectedProgram.code || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Tổng tín chỉ</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {selectedProgram.total_credits_required ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Tín chỉ tự chọn</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {selectedProgram.elective_credits_required ?? 0}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                  <Layers3 size={18} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Khung chương trình</h2>
                  <p className="text-sm text-slate-500">
                    Danh sách môn học thuộc chương trình đã chọn.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {detailLoading ? (
                  <div className="text-sm text-slate-500">Đang tải khung chương trình...</div>
                ) : curriculum.length > 0 ? (
                  curriculum.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.subject_name || "-"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.subject_code || "-"} • {item.credits ?? 0} tín chỉ
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
                              {item.subject_type || "-"}
                            </span>
                            <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">
                              Học kỳ gợi ý {item.recommended_semester ?? "-"}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                              Điểm tối thiểu {item.min_score_required ?? 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditCurriculum(item)}
                            className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => void handleDeleteCurriculum(item.id)}
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
                    {selectedProgramId
                      ? "Chương trình này chưa có môn học trong khung."
                      : "Chọn một chương trình để xem khung môn học."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <ModalFrame
        open={programModalOpen}
        title={editingProgramId ? "Cập nhật chương trình đào tạo" : "Thêm chương trình đào tạo"}
        submitLabel={editingProgramId ? "Cập nhật" : "Tạo mới"}
        submitting={submitting}
        onClose={closeProgramModal}
        onSubmit={handleProgramSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={programForm.faculty_id || ""}
            onChange={(e) =>
              setProgramForm((prev) => ({ ...prev, faculty_id: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chọn khoa</option>
            {faculties.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || `Faculty ${item.id}`}
              </option>
            ))}
          </select>
          <select
            value={programForm.status}
            onChange={(e) => setProgramForm((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-xl border px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={programForm.code}
            onChange={(e) => setProgramForm((prev) => ({ ...prev, code: e.target.value }))}
            className="rounded-xl border px-3 py-2"
            placeholder="Mã chương trình"
          />
          <input
            value={programForm.name}
            onChange={(e) => setProgramForm((prev) => ({ ...prev, name: e.target.value }))}
            className="rounded-xl border px-3 py-2"
            placeholder="Tên chương trình"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="number"
            min={0}
            value={programForm.total_credits_required}
            onChange={(e) =>
              setProgramForm((prev) => ({
                ...prev,
                total_credits_required: Number(e.target.value),
              }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Tổng tín chỉ"
          />
          <input
            type="number"
            min={0}
            value={programForm.elective_credits_required}
            onChange={(e) =>
              setProgramForm((prev) => ({
                ...prev,
                elective_credits_required: Number(e.target.value),
              }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Tín chỉ tự chọn"
          />
        </div>
        <textarea
          value={programForm.description}
          onChange={(e) => setProgramForm((prev) => ({ ...prev, description: e.target.value }))}
          className="min-h-28 rounded-xl border px-3 py-2"
          placeholder="Mô tả chương trình"
        />
      </ModalFrame>

      <ModalFrame
        open={curriculumModalOpen}
        title={editingCurriculumId ? "Cập nhật môn học trong khung" : "Thêm môn học vào khung"}
        submitLabel={editingCurriculumId ? "Cập nhật" : "Thêm môn"}
        submitting={submitting}
        onClose={closeCurriculumModal}
        onSubmit={handleCurriculumSubmit}
      >
        <select
          value={curriculumForm.subject_id || ""}
          onChange={(e) =>
            setCurriculumForm((prev) => ({ ...prev, subject_id: Number(e.target.value) }))
          }
          className="rounded-xl border px-3 py-2"
        >
          <option value="">Chọn môn học</option>
          {subjects.map((item) => (
            <option key={item.id} value={item.id}>
              {(item.name || `Subject ${item.id}`) +
                (item.code ? ` - ${item.code}` : "") +
                ` - ${item.credits ?? 0} TC`}
            </option>
          ))}
        </select>
        <div className="grid gap-4 md:grid-cols-3">
          <select
            value={curriculumForm.subject_type}
            onChange={(e) =>
              setCurriculumForm((prev) => ({ ...prev, subject_type: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="required">Bắt buộc</option>
            <option value="elective">Tự chọn</option>
            <option value="internship">Thực tập</option>
            <option value="thesis">Đồ án/Khóa luận</option>
          </select>
          <input
            type="number"
            min={1}
            value={curriculumForm.recommended_semester}
            onChange={(e) =>
              setCurriculumForm((prev) => ({
                ...prev,
                recommended_semester: Number(e.target.value),
              }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Học kỳ gợi ý"
          />
          <input
            type="number"
            step="0.1"
            min={0}
            max={10}
            value={curriculumForm.min_score_required}
            onChange={(e) =>
              setCurriculumForm((prev) => ({
                ...prev,
                min_score_required: Number(e.target.value),
              }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Điểm tối thiểu"
          />
        </div>
      </ModalFrame>

      <ModalFrame
        open={assignmentModalOpen}
        title="Gán chương trình cho sinh viên"
        submitLabel="Gán chương trình"
        submitting={submitting}
        onClose={closeAssignmentModal}
        onSubmit={handleAssignStudent}
      >
        <select
          value={assignmentForm.student_id || ""}
          onChange={(e) =>
            setAssignmentForm((prev) => ({ ...prev, student_id: Number(e.target.value) }))
          }
          className="rounded-xl border px-3 py-2"
        >
          <option value="">Chọn sinh viên</option>
          {students.map((item) => (
            <option key={item.id} value={item.id}>
              {item.full_name || item.username || `Student ${item.id}`}
            </option>
          ))}
        </select>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="date"
            value={assignmentForm.start_date}
            onChange={(e) =>
              setAssignmentForm((prev) => ({ ...prev, start_date: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
          />
          <input
            type="date"
            value={assignmentForm.expected_graduation_date}
            onChange={(e) =>
              setAssignmentForm((prev) => ({
                ...prev,
                expected_graduation_date: e.target.value,
              }))
            }
            className="rounded-xl border px-3 py-2"
          />
        </div>
        <select
          value={assignmentForm.status}
          onChange={(e) => setAssignmentForm((prev) => ({ ...prev, status: e.target.value }))}
          className="rounded-xl border px-3 py-2"
        >
          <option value="active">Đang học</option>
          <option value="completed">Hoàn thành</option>
          <option value="paused">Tạm dừng</option>
        </select>
      </ModalFrame>
    </>
  );
}
