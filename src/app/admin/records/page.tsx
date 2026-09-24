"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CalendarDays,
  Pencil,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { useToastMessage } from "@/hooks/use-toast-message";
import { getCollection } from "@/lib/student-portal";
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

type ScholarshipDefinitionItem = {
  id: number;
  name?: string;
  description?: string;
  amount?: number;
  semester_id?: number;
  semester_name?: string;
  min_gpa?: number;
  status?: string;
};

type StudentOption = {
  id: number;
  full_name?: string;
  username?: string;
  email?: string;
  class_name?: string;
  status?: string;
};

type SemesterOption = {
  id: number;
  name?: string;
};

type StudentStatusOption = {
  value: string;
  label: string;
};

type ScholarshipForm = {
  name: string;
  description: string;
  amount: number;
  semester_id: number;
  min_gpa: string;
  status: string;
};

type AwardForm = {
  scholarship_id: number;
  student_id: number;
  awarded_date: string;
  note: string;
  status: string;
};

type DisciplinaryForm = {
  student_id: number;
  semester_id: number;
  title: string;
  description: string;
  level: string;
  decision_date: string;
  status: string;
};

type StudentStatusForm = {
  student_id: number;
  status: string;
  effective_date: string;
  reason: string;
  decision_no: string;
};

const initialScholarshipForm: ScholarshipForm = {
  name: "",
  description: "",
  amount: 0,
  semester_id: 0,
  min_gpa: "",
  status: "approved",
};

const initialAwardForm: AwardForm = {
  scholarship_id: 0,
  student_id: 0,
  awarded_date: "",
  note: "",
  status: "approved",
};

const initialDisciplinaryForm: DisciplinaryForm = {
  student_id: 0,
  semester_id: 0,
  title: "",
  description: "",
  level: "",
  decision_date: "",
  status: "active",
};

const initialStudentStatusForm: StudentStatusForm = {
  student_id: 0,
  status: "",
  effective_date: new Date().toISOString().slice(0, 10),
  reason: "",
  decision_no: "",
};

const defaultStudentStatuses: StudentStatusOption[] = [
  { value: "active", label: "Dang hoc" },
  { value: "bao_luu", label: "Bao luu" },
  { value: "nghi_hoc", label: "Nghi hoc" },
  { value: "tot_nghiep", label: "Tot nghiep" },
];

function getStudentStatusClassName(status?: string) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "active" || normalized === "dang_hoc") return "bg-emerald-50 text-emerald-700";
  if (normalized === "bao_luu") return "bg-amber-50 text-amber-700";
  if (normalized === "nghi_hoc") return "bg-rose-50 text-rose-700";
  if (normalized === "tot_nghiep") return "bg-sky-50 text-sky-700";
  return "bg-slate-100 text-slate-700";
}

function normalizeStudentStatuses(payload: unknown): StudentStatusOption[] {
  const collection = getCollection(payload);

  if (collection.length > 0) {
    return collection
      .map((item) => {
        if (typeof item === "string") {
          return { value: item, label: item };
        }

        if (item && typeof item === "object") {
          const option = item as {
            value?: string;
            code?: string;
            status?: string;
            key?: string;
            label?: string;
            name?: string;
          };
          const value = option.value || option.code || option.status || option.key || "";
          const label = option.label || option.name || value;
          return value ? { value, label } : null;
        }

        return null;
      })
      .filter(Boolean) as StudentStatusOption[];
  }

  if (payload && typeof payload === "object") {
    const payloadObject = payload as {
      data?: unknown;
      statuses?: unknown;
    };
    const source =
      payloadObject.statuses && typeof payloadObject.statuses === "object"
        ? (payloadObject.statuses as Record<string, string>)
        : payloadObject.data && typeof payloadObject.data === "object"
          ? (payloadObject.data as Record<string, string>)
          : (payload as Record<string, string>);

    return Object.entries(source)
      .filter(([, label]) => typeof label === "string")
      .map(([value, label]) => ({ value, label }));
  }

  return defaultStudentStatuses;
}

function ModalFrame({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel,
  submitting,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
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

export default function AdminRecordsPage() {
  const authUser = getAuthUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [scholarships, setScholarships] = useState<ScholarshipDefinitionItem[]>([]);
  const [awards, setAwards] = useState<ScholarshipAwardItem[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryActionItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<StudentStatusOption[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);

  const [scholarshipForm, setScholarshipForm] = useState(initialScholarshipForm);
  const [awardForm, setAwardForm] = useState(initialAwardForm);
  const [disciplinaryForm, setDisciplinaryForm] = useState(initialDisciplinaryForm);
  const [studentStatusForm, setStudentStatusForm] = useState(initialStudentStatusForm);

  const [scholarshipModalOpen, setScholarshipModalOpen] = useState(false);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [disciplinaryModalOpen, setDisciplinaryModalOpen] = useState(false);
  const [studentStatusModalOpen, setStudentStatusModalOpen] = useState(false);

  const [editingScholarshipId, setEditingScholarshipId] = useState<number | null>(null);
  const [editingAwardId, setEditingAwardId] = useState<number | null>(null);
  const [editingDisciplinaryId, setEditingDisciplinaryId] = useState<number | null>(null);

  useToastMessage(error, "error");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [scholarshipsRes, awardsRes, disciplinaryRes, studentsRes, statusesRes, semestersRes] =
        await Promise.allSettled([
          api.get("/scholarships"),
          api.get("/scholarships/awards"),
          api.get("/disciplinary-actions"),
          api.get("/student-info"),
          api.get("/student-info/statuses"),
          api.get("/semesters"),
        ]);

      const nextScholarships =
        scholarshipsRes.status === "fulfilled"
          ? (getCollection(scholarshipsRes.value.data) as ScholarshipDefinitionItem[])
          : [];
      const nextAwards =
        awardsRes.status === "fulfilled"
          ? (getCollection(awardsRes.value.data) as ScholarshipAwardItem[])
          : [];
      const nextDisciplinaryActions =
        disciplinaryRes.status === "fulfilled"
          ? (getCollection(disciplinaryRes.value.data) as DisciplinaryActionItem[])
          : [];
      const nextStudents =
        studentsRes.status === "fulfilled"
          ? (getCollection(studentsRes.value.data) as StudentOption[])
          : [];
      const nextStudentStatuses =
        statusesRes.status === "fulfilled"
          ? normalizeStudentStatuses(statusesRes.value.data)
          : defaultStudentStatuses;
      const nextSemesters =
        semestersRes.status === "fulfilled"
          ? (getCollection(semestersRes.value.data) as SemesterOption[])
          : [];

      setScholarships(nextScholarships);
      setAwards(nextAwards);
      setDisciplinaryActions(nextDisciplinaryActions);
      setStudents(nextStudents);
      setStudentStatuses(nextStudentStatuses);
      setSemesters(nextSemesters);

      const failedMessages = [
        scholarshipsRes.status === "rejected"
          ? axios.isAxiosError(scholarshipsRes.reason)
            ? scholarshipsRes.reason.response?.data?.message || "Không tải được danh sách học bổng"
            : "Không tải được danh sách học bổng"
          : "",
        awardsRes.status === "rejected"
          ? axios.isAxiosError(awardsRes.reason)
            ? awardsRes.reason.response?.data?.message || "Không tải được học bổng đã cấp"
            : "Không tải được học bổng đã cấp"
          : "",
        disciplinaryRes.status === "rejected"
          ? axios.isAxiosError(disciplinaryRes.reason)
            ? disciplinaryRes.reason.response?.data?.message || "Không tải được danh sách kỷ luật"
            : "Không tải được danh sách kỷ luật"
          : "",
        statusesRes.status === "rejected"
          ? axios.isAxiosError(statusesRes.reason)
            ? statusesRes.reason.response?.data?.message || "Khong tai duoc danh sach trang thai sinh vien"
            : "Khong tai duoc danh sach trang thai sinh vien"
          : "",
      ].filter(Boolean);

      setError(failedMessages.join(" | "));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được học bổng và kỷ luật");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được học bổng và kỷ luật");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalScholarshipAmount = useMemo(
    () => awards.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [awards]
  );

  const studentStatusLabelMap = useMemo(
    () => new Map(studentStatuses.map((item) => [item.value, item.label])),
    [studentStatuses]
  );

  const activeStudents = useMemo(
    () => students.filter((student) => String(student.status || "").toLowerCase() === "active").length,
    [students]
  );

  const getStudentStatusLabel = useCallback(
    (status?: string) => {
      if (!status) return "Chua cap nhat";
      return studentStatusLabelMap.get(status) || status;
    },
    [studentStatusLabelMap]
  );

  const closeScholarshipModal = () => {
    setScholarshipModalOpen(false);
    setEditingScholarshipId(null);
    setScholarshipForm(initialScholarshipForm);
  };

  const closeAwardModal = () => {
    setAwardModalOpen(false);
    setEditingAwardId(null);
    setAwardForm(initialAwardForm);
  };

  const closeDisciplinaryModal = () => {
    setDisciplinaryModalOpen(false);
    setEditingDisciplinaryId(null);
    setDisciplinaryForm(initialDisciplinaryForm);
  };

  const closeStudentStatusModal = () => {
    setStudentStatusModalOpen(false);
    setStudentStatusForm(initialStudentStatusForm);
  };

  const openStudentStatusModal = (student: StudentOption) => {
    setStudentStatusForm({
      ...initialStudentStatusForm,
      student_id: Number(student.id),
      status: student.status || studentStatuses[0]?.value || "",
    });
    setStudentStatusModalOpen(true);
  };

  const handleStudentStatusSubmit = async () => {
    if (!studentStatusForm.student_id || !studentStatusForm.status.trim()) {
      toast.error("Vui long chon sinh vien va trang thai");
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/student-info/${studentStatusForm.student_id}/status`, {
        status: studentStatusForm.status.trim(),
        effective_date: studentStatusForm.effective_date || null,
        reason: studentStatusForm.reason.trim(),
        decision_no: studentStatusForm.decision_no.trim(),
      });

      toast.success("Cap nhat trang thai sinh vien thanh cong");
      closeStudentStatusModal();
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Cap nhat trang thai sinh vien that bai");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Cap nhat trang thai sinh vien that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleScholarshipSubmit = async () => {
    if (!scholarshipForm.name.trim() || !scholarshipForm.status.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin học bổng");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: scholarshipForm.name.trim(),
        description: scholarshipForm.description.trim(),
        amount: Number(scholarshipForm.amount || 0),
        semester_id: scholarshipForm.semester_id || null,
        min_gpa: scholarshipForm.min_gpa.trim() ? Number(scholarshipForm.min_gpa) : null,
        status: scholarshipForm.status.trim(),
      };

      if (editingScholarshipId) {
        await api.put(`/scholarships/${editingScholarshipId}`, payload);
        toast.success("Cập nhật học bổng thành công");
      } else {
        await api.post("/scholarships", payload);
        toast.success("Tạo học bổng thành công");
      }

      closeScholarshipModal();
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Lưu học bổng thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Lưu học bổng thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAwardSubmit = async () => {
    if (!awardForm.scholarship_id || !awardForm.student_id || !awardForm.awarded_date) {
      toast.error("Vui lòng nhập đầy đủ thông tin cấp học bổng");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        scholarship_id: Number(awardForm.scholarship_id),
        student_id: Number(awardForm.student_id),
        awarded_date: awardForm.awarded_date,
        note: awardForm.note.trim(),
        status: awardForm.status.trim(),
      };

      if (editingAwardId) {
        await api.put(`/scholarships/awards/${editingAwardId}`, payload);
        toast.success("Cập nhật cấp học bổng thành công");
      } else {
        await api.post("/scholarships/awards", payload);
        toast.success("Cấp học bổng thành công");
      }

      closeAwardModal();
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Lưu cấp học bổng thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Lưu cấp học bổng thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisciplinarySubmit = async () => {
    if (
      !disciplinaryForm.student_id ||
      !disciplinaryForm.title.trim() ||
      !disciplinaryForm.level.trim() ||
      !disciplinaryForm.decision_date
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin kỷ luật");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        student_id: Number(disciplinaryForm.student_id),
        semester_id: disciplinaryForm.semester_id || null,
        title: disciplinaryForm.title.trim(),
        description: disciplinaryForm.description.trim(),
        level: disciplinaryForm.level.trim(),
        decision_date: disciplinaryForm.decision_date,
        status: disciplinaryForm.status.trim(),
        decided_by: Number(authUser?.id || 0) || null,
      };

      if (editingDisciplinaryId) {
        await api.put(`/disciplinary-actions/${editingDisciplinaryId}`, payload);
        toast.success("Cập nhật kỷ luật thành công");
      } else {
        await api.post("/disciplinary-actions", payload);
        toast.success("Tạo quyết định kỷ luật thành công");
      }

      closeDisciplinaryModal();
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Lưu kỷ luật thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Lưu kỷ luật thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type: "scholarship" | "award" | "disciplinary", id: number) => {
    const labels = {
      scholarship: "học bổng",
      award: "bản ghi cấp học bổng",
      disciplinary: "quyết định kỷ luật",
    };

    if (!window.confirm(`Bạn có chắc muốn xóa ${labels[type]} này không?`)) return;

    try {
      if (type === "scholarship") await api.delete(`/scholarships/${id}`);
      if (type === "award") await api.delete(`/scholarships/awards/${id}`);
      if (type === "disciplinary") await api.delete(`/disciplinary-actions/${id}`);
      toast.success("Xóa thành công");
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Xóa thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Xóa thất bại");
      }
    }
  };

  const openEditScholarship = (item: ScholarshipDefinitionItem) => {
    setEditingScholarshipId(item.id);
    setScholarshipForm({
      name: item.name || "",
      description: item.description || "",
      amount: Number(item.amount || 0),
      semester_id: Number(item.semester_id || 0),
      min_gpa: item.min_gpa == null ? "" : String(item.min_gpa),
      status: item.status || "approved",
    });
    setScholarshipModalOpen(true);
  };

  const openEditAward = (item: ScholarshipAwardItem) => {
    setEditingAwardId(item.id);
    setAwardForm({
      scholarship_id: Number(item.scholarship_id || 0),
      student_id: Number(item.student_id || 0),
      awarded_date: item.awarded_date ? String(item.awarded_date).slice(0, 10) : "",
      note: item.note || "",
      status: item.status || "approved",
    });
    setAwardModalOpen(true);
  };

  const openEditDisciplinary = (item: DisciplinaryActionItem) => {
    setEditingDisciplinaryId(item.id);
    setDisciplinaryForm({
      student_id: Number(item.student_id || 0),
      semester_id: Number(item.semester_id || 0),
      title: item.title || "",
      description: item.description || "",
      level: item.level || "",
      decision_date: item.decision_date ? String(item.decision_date).slice(0, 10) : "",
      status: item.status || "active",
    });
    setDisciplinaryModalOpen(true);
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải học bổng và kỷ luật...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {error ? (
          <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>
        ) : null}

        <section className="rounded-[2rem] bg-gradient-to-r from-indigo-700 to-sky-700 p-6 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.24em] text-white/70">Quản lý học bổng</p>
          <h1 className="mt-3 text-3xl font-bold">Học bổng và kỷ luật</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Theo dõi danh mục học bổng, danh sách đã cấp và các quyết định kỷ luật trong hệ
            thống.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Trang thai sinh vien</h2>
              <p className="text-sm text-slate-500">
                Cap nhat trang thai hoc tap qua API PATCH /student-info/:id/status.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                Tong: {students.length}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                Dang hoc: {activeStudents}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Sinh vien</th>
                    <th className="px-5 py-4 font-semibold">Lop</th>
                    <th className="px-5 py-4 font-semibold">Trang thai hien tai</th>
                    <th className="px-5 py-4 text-center font-semibold">Hanh dong</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">
                            {student.full_name || student.username || `Sinh vien ${student.id}`}
                          </div>
                          <div className="text-xs text-slate-500">{student.email || `ID #${student.id}`}</div>
                        </td>
                        <td className="px-5 py-4">{student.class_name || "-"}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStudentStatusClassName(student.status)}`}
                          >
                            {getStudentStatusLabel(student.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => openStudentStatusModal(student)}
                              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700"
                            >
                              <Pencil size={14} />
                              Cap nhat
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                        Khong co du lieu sinh vien.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                <ScrollText size={18} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Danh mục học bổng</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{scholarships.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Award size={18} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Đã cấp học bổng</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{awards.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Tổng giá trị đã cấp</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatScholarshipMoney(totalScholarshipAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <AlertTriangle size={18} />
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Danh mục học bổng</h2>
              <p className="text-sm text-slate-500">Tạo, sửa, xóa học bổng.</p>
            </div>
            <button
              type="button"
              onClick={() => setScholarshipModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Thêm học bổng
            </button>
          </div>

          <div className="space-y-3">
            {scholarships.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {item.name || `Học bổng ${item.id}`}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.description || "Chưa có mô tả."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span>Học kỳ: {item.semester_name || "-"}</span>
                      <span>Giá trị: {formatScholarshipMoney(item.amount)}</span>
                      <span>GPA tối thiểu: {item.min_gpa ?? "-"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getScholarshipStatusClassName(item.status)}`}
                    >
                      {getScholarshipStatusLabel(item.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditScholarship(item)}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete("scholarship", item.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Danh sách học bổng đã cấp</h2>
              <p className="text-sm text-slate-500">Cấp và quản lý học bổng cho sinh viên.</p>
            </div>
            <button
              type="button"
              onClick={() => setAwardModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Cấp học bổng
            </button>
          </div>

          <div className="space-y-3">
            {awards.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {item.scholarship_name || "Học bổng"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span>Sinh viên: {item.student_name || "-"}</span>
                      <span>Ngày cấp: {formatStudentRecordDate(item.awarded_date)}</span>
                      <span>Giá trị: {formatScholarshipMoney(item.amount)}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">{item.note || "Không có ghi chú."}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getScholarshipStatusClassName(item.status)}`}
                    >
                      {getScholarshipStatusLabel(item.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditAward(item)}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete("award", item.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Kỷ luật</h2>
              <p className="text-sm text-slate-500">Tạo, sửa, xóa các quyết định kỷ luật.</p>
            </div>
            <button
              type="button"
              onClick={() => setDisciplinaryModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Thêm kỷ luật
            </button>
          </div>

          <div className="space-y-3">
            {disciplinaryActions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {item.title || "Quyết định kỷ luật"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                      <span>Sinh viên: {item.student_name || "-"}</span>
                      <span>Lớp: {item.class_name || "-"}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" />
                        {formatStudentRecordDate(item.decision_date)}
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {getDisciplinaryStatusLabel(item.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditDisciplinary(item)}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-amber-700"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete("disciplinary", item.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ModalFrame
        open={studentStatusModalOpen}
        title="Cap nhat trang thai sinh vien"
        onClose={closeStudentStatusModal}
        onSubmit={handleStudentStatusSubmit}
        submitLabel="Cap nhat"
        submitting={submitting}
      >
        <select
          value={studentStatusForm.student_id || ""}
          onChange={(e) =>
            setStudentStatusForm((prev) => ({ ...prev, student_id: Number(e.target.value) }))
          }
          className="rounded-xl border px-3 py-2"
        >
          <option value="">Chon sinh vien</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name || student.username || `Sinh vien ${student.id}`}
            </option>
          ))}
        </select>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={studentStatusForm.status}
            onChange={(e) =>
              setStudentStatusForm((prev) => ({ ...prev, status: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chon trang thai</option>
            {studentStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={studentStatusForm.effective_date}
            onChange={(e) =>
              setStudentStatusForm((prev) => ({ ...prev, effective_date: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
          />
        </div>
        <input
          value={studentStatusForm.decision_no}
          onChange={(e) =>
            setStudentStatusForm((prev) => ({ ...prev, decision_no: e.target.value }))
          }
          className="rounded-xl border px-3 py-2"
          placeholder="So quyet dinh, vi du QD-BL-001"
        />
        <textarea
          value={studentStatusForm.reason}
          onChange={(e) =>
            setStudentStatusForm((prev) => ({ ...prev, reason: e.target.value }))
          }
          className="min-h-24 rounded-xl border px-3 py-2"
          placeholder="Ly do"
        />
      </ModalFrame>

      <ModalFrame
        open={scholarshipModalOpen}
        title={editingScholarshipId ? "Cập nhật học bổng" : "Thêm học bổng"}
        onClose={closeScholarshipModal}
        onSubmit={handleScholarshipSubmit}
        submitLabel={editingScholarshipId ? "Cập nhật" : "Tạo mới"}
        submitting={submitting}
      >
        <input
          value={scholarshipForm.name}
          onChange={(e) => setScholarshipForm((prev) => ({ ...prev, name: e.target.value }))}
          className="rounded-xl border px-3 py-2"
          placeholder="Tên học bổng"
        />
        <textarea
          value={scholarshipForm.description}
          onChange={(e) =>
            setScholarshipForm((prev) => ({ ...prev, description: e.target.value }))
          }
          className="min-h-24 rounded-xl border px-3 py-2"
          placeholder="Mô tả"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="number"
            min={0}
            value={scholarshipForm.amount}
            onChange={(e) =>
              setScholarshipForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="Giá trị"
          />
          <input
            type="number"
            step="0.1"
            min={0}
            max={4}
            value={scholarshipForm.min_gpa}
            onChange={(e) =>
              setScholarshipForm((prev) => ({ ...prev, min_gpa: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
            placeholder="GPA tối thiểu"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={scholarshipForm.semester_id || ""}
            onChange={(e) =>
              setScholarshipForm((prev) => ({ ...prev, semester_id: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chọn học kỳ</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name || `Học kỳ ${semester.id}`}
              </option>
            ))}
          </select>
          <select
            value={scholarshipForm.status}
            onChange={(e) => setScholarshipForm((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-xl border px-3 py-2"
          >
            <option value="approved">Đã cấp</option>
            <option value="pending">Đang xét</option>
            <option value="rejected">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </ModalFrame>

      <ModalFrame
        open={awardModalOpen}
        title={editingAwardId ? "Cập nhật cấp học bổng" : "Cấp học bổng"}
        onClose={closeAwardModal}
        onSubmit={handleAwardSubmit}
        submitLabel={editingAwardId ? "Cập nhật" : "Cấp học bổng"}
        submitting={submitting}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={awardForm.scholarship_id || ""}
            onChange={(e) => setAwardForm((prev) => ({ ...prev, scholarship_id: Number(e.target.value) }))}
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chọn học bổng</option>
            {scholarships.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name || `Học bổng ${item.id}`}
              </option>
            ))}
          </select>
          <select
            value={awardForm.student_id || ""}
            onChange={(e) => setAwardForm((prev) => ({ ...prev, student_id: Number(e.target.value) }))}
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chọn sinh viên</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name || student.username || `Sinh viên ${student.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="date"
            value={awardForm.awarded_date}
            onChange={(e) => setAwardForm((prev) => ({ ...prev, awarded_date: e.target.value }))}
            className="rounded-xl border px-3 py-2"
          />
          <select
            value={awardForm.status}
            onChange={(e) => setAwardForm((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-xl border px-3 py-2"
          >
            <option value="approved">Đã cấp</option>
            <option value="pending">Đang xét</option>
            <option value="rejected">Từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        <textarea
          value={awardForm.note}
          onChange={(e) => setAwardForm((prev) => ({ ...prev, note: e.target.value }))}
          className="min-h-24 rounded-xl border px-3 py-2"
          placeholder="Ghi chú"
        />
      </ModalFrame>

      <ModalFrame
        open={disciplinaryModalOpen}
        title={editingDisciplinaryId ? "Cập nhật kỷ luật" : "Thêm kỷ luật"}
        onClose={closeDisciplinaryModal}
        onSubmit={handleDisciplinarySubmit}
        submitLabel={editingDisciplinaryId ? "Cập nhật" : "Tạo mới"}
        submitting={submitting}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={disciplinaryForm.student_id || ""}
            onChange={(e) =>
              setDisciplinaryForm((prev) => ({ ...prev, student_id: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chọn sinh viên</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name || student.username || `Sinh viên ${student.id}`}
              </option>
            ))}
          </select>
          <select
            value={disciplinaryForm.semester_id || ""}
            onChange={(e) =>
              setDisciplinaryForm((prev) => ({ ...prev, semester_id: Number(e.target.value) }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="">Chọn học kỳ</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name || `Học kỳ ${semester.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={disciplinaryForm.title}
            onChange={(e) => setDisciplinaryForm((prev) => ({ ...prev, title: e.target.value }))}
            className="rounded-xl border px-3 py-2"
            placeholder="Tiêu đề"
          />
          <input
            value={disciplinaryForm.level}
            onChange={(e) => setDisciplinaryForm((prev) => ({ ...prev, level: e.target.value }))}
            className="rounded-xl border px-3 py-2"
            placeholder="Mức độ"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="date"
            value={disciplinaryForm.decision_date}
            onChange={(e) =>
              setDisciplinaryForm((prev) => ({ ...prev, decision_date: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
          />
          <select
            value={disciplinaryForm.status}
            onChange={(e) =>
              setDisciplinaryForm((prev) => ({ ...prev, status: e.target.value }))
            }
            className="rounded-xl border px-3 py-2"
          >
            <option value="active">Đang hiệu lực</option>
            <option value="resolved">Đã xử lý</option>
            <option value="completed">Hoàn tất</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        <textarea
          value={disciplinaryForm.description}
          onChange={(e) =>
            setDisciplinaryForm((prev) => ({ ...prev, description: e.target.value }))
          }
          className="min-h-24 rounded-xl border px-3 py-2"
          placeholder="Mô tả"
        />
      </ModalFrame>
    </>
  );
}
