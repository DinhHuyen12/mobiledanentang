"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import {
  BarChart3,
  Users,
  BookOpen,
  Layers,
  Building2,
  CalendarRange,
  KeyRound,
  PlusCircle,
  UserPlus,
  ClipboardList,
  Clock3,
  LibraryBig,
  X,
} from "lucide-react";
import AddUserModal from "../user/AddUserModal";
import AddSubjectModal from "../subjects/AddSubjectModal";
import AddClassModal from "../classes/AddClassModal";
import { useToastMessage } from "@/hooks/use-toast-message";

type DashboardStats = {
  users: number;
  subjects: number;
  classes: number;
  faculties: number;
  academicYears: number;
  roles: number;
  semesters: number;
};

type Activity = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

type UserForm = {
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role_id: number;
  password: string;
};

type SubjectForm = {
  subject_code: string;
  name: string;
  credits: number;
  faculty_id: number;
};

type ClassForm = {
  name: string;
  faculty_id: number;
  academic_year_id: number;
};

type SimpleNameForm = {
  name: string;
};

type LookupOption = {
  id: number;
  name: string;
};

type DistributionItem = {
  label: string;
  value: number;
  colorClass: string;
  textClass: string;
  stroke: string;
};

const initialUserForm: UserForm = {
  username: "",
  email: "",
  full_name: "",
  phone: "",
  role_id: 0,
  password: "",
};

const initialSubjectForm: SubjectForm = {
  subject_code: "",
  name: "",
  credits: 0,
  faculty_id: 0,
};

const initialClassForm: ClassForm = {
  name: "",
  faculty_id: 0,
  academic_year_id: 0,
};

const initialSimpleNameForm: SimpleNameForm = {
  name: "",
};

type QuickActionType =
  | "user"
  | "subject"
  | "class"
  | "faculty"
  | "academic-year"
  | "role";

function SimpleNameModal({
  open,
  title,
  description,
  label,
  placeholder,
  submitLabel,
  accentClassName,
  submitting,
  value,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  accentClassName: string;
  submitting: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>

          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <label className="text-sm font-medium">{label}</label>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full rounded-xl border px-4 py-2"
            placeholder={placeholder}
          />
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Huy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={`rounded-xl px-4 py-2 text-white ${accentClassName}`}
          >
            {submitting ? "Dang luu..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function DonutChart({
  items,
  total,
}: {
  items: DistributionItem[];
  total: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const segments = items.map((item, index) => {
    const previous = items
      .slice(0, index)
      .reduce((sum, currentItem) => sum + currentItem.value, 0);
    const percent = total > 0 ? item.value / total : 0;
    const segment = circumference * percent;
    const offset = circumference - (circumference * previous) / Math.max(total, 1);

    return {
      ...item,
      segment,
      offset,
    };
  });

  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="20" />
        {segments.map((item) => (
          <circle
            key={item.label}
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={item.stroke}
            strokeWidth="20"
            strokeDasharray={`${item.segment} ${circumference - item.segment}`}
            strokeDashoffset={item.offset}
            strokeLinecap="round"
          />
        ))}
      </svg>

      <div className="absolute text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{total}</p>
      </div>
    </div>
  );
}

function SimpleBarChart({
  items,
  maxValue,
}: {
  items: DistributionItem[];
  maxValue: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const height = maxValue > 0 ? Math.max((item.value / maxValue) * 108, item.value > 0 ? 10 : 4) : 4;

        return (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{item.label}</span>
              <span className={`text-sm font-semibold ${item.textClass}`}>{item.value}</span>
            </div>
            <div className="mt-4 flex h-28 items-end">
              <div
                className={`w-full rounded-t-2xl ${item.colorClass}`}
                style={{ height }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    subjects: 0,
    classes: 0,
    faculties: 0,
    academicYears: 0,
    roles: 0,
    semesters: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [faculties, setFaculties] = useState<LookupOption[]>([]);
  const [academicYears, setAcademicYears] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">("");

  const [openUserModal, setOpenUserModal] = useState(false);
  const [openSubjectModal, setOpenSubjectModal] = useState(false);
  const [openClassModal, setOpenClassModal] = useState(false);
  const [openFacultyModal, setOpenFacultyModal] = useState(false);
  const [openAcademicYearModal, setOpenAcademicYearModal] = useState(false);
  const [openRoleModal, setOpenRoleModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [userForm, setUserForm] = useState<UserForm>(initialUserForm);
  const [subjectForm, setSubjectForm] = useState<SubjectForm>(initialSubjectForm);
  const [classForm, setClassForm] = useState<ClassForm>(initialClassForm);
  const [facultyForm, setFacultyForm] = useState<SimpleNameForm>(initialSimpleNameForm);
  const [academicYearForm, setAcademicYearForm] = useState<SimpleNameForm>(initialSimpleNameForm);
  const [roleForm, setRoleForm] = useState<SimpleNameForm>(initialSimpleNameForm);

  useToastMessage(error, "error");
  useToastMessage(feedback, feedbackType);

  const getCollection = (payload: unknown) => {
    if (Array.isArray(payload)) return payload;
    if (
      payload &&
      typeof payload === "object" &&
      "data" in payload &&
      Array.isArray((payload as { data?: unknown }).data)
    ) {
      return (payload as { data: unknown[] }).data;
    }
    return [];
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        statsResult,
        activityResult,
        facultiesResult,
        yearsResult,
        rolesResult,
        semestersResult,
      ] = await Promise.allSettled([
        api.get("/dashboard/summary"),
        api.get("/dashboard/recent-activities"),
        api.get("/faculties"),
        api.get("/academic-years"),
        api.get("/roles"),
        api.get("/semesters"),
      ]);

      if (statsResult.status !== "fulfilled") {
        throw statsResult.reason;
      }

      const summary = statsResult.value.data?.data ?? {};
      const activityData =
        activityResult.status === "fulfilled"
          ? getCollection(activityResult.value.data)
          : [];
      const facultiesData =
        facultiesResult.status === "fulfilled"
          ? getCollection(facultiesResult.value.data)
          : [];
      const yearsData =
        yearsResult.status === "fulfilled"
          ? getCollection(yearsResult.value.data)
          : [];
      const rolesData =
        rolesResult.status === "fulfilled"
          ? getCollection(rolesResult.value.data)
          : [];
      const semestersData =
        semestersResult.status === "fulfilled"
          ? getCollection(semestersResult.value.data)
          : [];

      setStats({
        users: summary.totalUsers ?? 0,
        subjects: summary.totalSubjects ?? 0,
        classes: summary.totalClasses ?? 0,
        faculties: facultiesData.length,
        academicYears: yearsData.length,
        roles: rolesData.length,
        semesters: semestersData.length,
      });

      setActivities(activityData);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Loi");
      } else {
        setError("Loi");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLookups = useCallback(async () => {
    try {
      const [facultiesRes, yearsRes] = await Promise.all([
        api.get("/faculties"),
        api.get("/academic-years"),
      ]);

      const facultiesData = Array.isArray(facultiesRes.data)
        ? facultiesRes.data
        : Array.isArray(facultiesRes.data.data)
          ? facultiesRes.data.data
          : [];

      const yearsData = Array.isArray(yearsRes.data)
        ? yearsRes.data
        : Array.isArray(yearsRes.data.data)
          ? yearsRes.data.data
          : [];

      setFaculties(facultiesData);
      setAcademicYears(yearsData);
    } catch {}
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchLookups();
  }, [fetchDashboardData, fetchLookups]);

  const closeAllModals = useCallback(() => {
    setOpenUserModal(false);
    setOpenSubjectModal(false);
    setOpenClassModal(false);
    setOpenFacultyModal(false);
    setOpenAcademicYearModal(false);
    setOpenRoleModal(false);
    setUserForm(initialUserForm);
    setSubjectForm(initialSubjectForm);
    setClassForm(initialClassForm);
    setFacultyForm(initialSimpleNameForm);
    setAcademicYearForm(initialSimpleNameForm);
    setRoleForm(initialSimpleNameForm);
  }, []);

  const openQuickAction = (action: QuickActionType) => {
    closeAllModals();

    switch (action) {
      case "user":
        setOpenUserModal(true);
        break;
      case "subject":
        setOpenSubjectModal(true);
        break;
      case "class":
        setOpenClassModal(true);
        break;
      case "faculty":
        setOpenFacultyModal(true);
        break;
      case "academic-year":
        setOpenAcademicYearModal(true);
        break;
      case "role":
        setOpenRoleModal(true);
        break;
    }
  };

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedbackType(type);
    setFeedback(message);
  };

  const refreshAfterSuccess = async (message: string) => {
    showFeedback("success", message);
    closeAllModals();
    await Promise.all([fetchDashboardData(), fetchLookups()]);
  };

  const handleAddUser = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFeedback("");
      setFeedbackType("");

      if (!userForm.password.trim()) {
        showFeedback("error", "Vui long nhap mat khau");
        return;
      }

      await api.post("/users", {
        ...userForm,
        role_id: Number(userForm.role_id),
      });

      await refreshAfterSuccess("Them user thanh cong");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showFeedback("error", error.response?.data?.message || "Them user that bai");
      } else {
        showFeedback("error", "Them user that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubject = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFeedback("");
      setFeedbackType("");

      await api.post("/subjects", {
        subject_code: subjectForm.subject_code,
        name: subjectForm.name,
        subject_name: subjectForm.name,
        credits: Number(subjectForm.credits),
        faculty_id: Number(subjectForm.faculty_id),
      });

      await refreshAfterSuccess("Them mon hoc thanh cong");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showFeedback("error", error.response?.data?.message || "Them mon hoc that bai");
      } else {
        showFeedback("error", "Them mon hoc that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClass = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFeedback("");
      setFeedbackType("");

      await api.post("/classes", {
        name: classForm.name.trim(),
        faculty_id: Number(classForm.faculty_id),
        academic_year_id: Number(classForm.academic_year_id),
      });

      await refreshAfterSuccess("Them lop thanh cong");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showFeedback("error", error.response?.data?.message || "Them lop that bai");
      } else {
        showFeedback("error", "Them lop that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFaculty = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFeedback("");
      setFeedbackType("");

      if (!facultyForm.name.trim()) {
        showFeedback("error", "Vui long nhap ten khoa");
        return;
      }

      await api.post("/faculties", { name: facultyForm.name.trim() });
      await refreshAfterSuccess("Them khoa thanh cong");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showFeedback("error", error.response?.data?.message || "Them khoa that bai");
      } else {
        showFeedback("error", "Them khoa that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAcademicYear = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFeedback("");
      setFeedbackType("");

      if (!academicYearForm.name.trim()) {
        showFeedback("error", "Vui long nhap ten nam hoc");
        return;
      }

      await api.post("/academic-years", { name: academicYearForm.name.trim() });
      await refreshAfterSuccess("Them nam hoc thanh cong");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showFeedback("error", error.response?.data?.message || "Them nam hoc that bai");
      } else {
        showFeedback("error", "Them nam hoc that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRole = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFeedback("");
      setFeedbackType("");

      if (!roleForm.name.trim()) {
        showFeedback("error", "Vui long nhap ten vai tro");
        return;
      }

      await api.post("/roles", { name: roleForm.name.trim() });
      await refreshAfterSuccess("Them vai tro thanh cong");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showFeedback("error", error.response?.data?.message || "Them vai tro that bai");
      } else {
        showFeedback("error", "Them vai tro that bai");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Dang tai...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const quickOverview = [
    {
      label: "Users",
      value: stats.users,
      icon: Users,
      className: "bg-blue-50 text-blue-700",
    },
    {
      label: "Subjects",
      value: stats.subjects,
      icon: BookOpen,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Classes",
      value: stats.classes,
      icon: Layers,
      className: "bg-violet-50 text-violet-700",
    },
    {
      label: "Activities",
      value: activities.length,
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
  ];

  const supportCards = [
    {
      label: "Nam hoc",
      value: stats.academicYears,
      icon: CalendarRange,
      textClass: "text-amber-600",
    },
    {
      label: "Hoc ky",
      value: stats.semesters,
      icon: LibraryBig,
      textClass: "text-cyan-600",
    },
    {
      label: "Vai tro",
      value: stats.roles,
      icon: KeyRound,
      textClass: "text-violet-600",
    },
    {
      label: "Hoat dong moi",
      value: activities.length,
      icon: Clock3,
      textClass: "text-slate-700",
    },
  ];

  const distribution: DistributionItem[] = [
    {
      label: "Users",
      value: stats.users,
      colorClass: "bg-blue-500",
      textClass: "text-blue-600",
      stroke: "#3b82f6",
    },
    {
      label: "Subjects",
      value: stats.subjects,
      colorClass: "bg-emerald-500",
      textClass: "text-emerald-600",
      stroke: "#10b981",
    },
    {
      label: "Classes",
      value: stats.classes,
      colorClass: "bg-violet-500",
      textClass: "text-violet-600",
      stroke: "#8b5cf6",
    },
    {
      label: "Faculties",
      value: stats.faculties,
      colorClass: "bg-rose-500",
      textClass: "text-rose-600",
      stroke: "#f43f5e",
    },
    {
      label: "Years",
      value: stats.academicYears,
      colorClass: "bg-amber-500",
      textClass: "text-amber-600",
      stroke: "#f59e0b",
    },
    {
      label: "Semesters",
      value: stats.semesters,
      colorClass: "bg-cyan-500",
      textClass: "text-cyan-600",
      stroke: "#06b6d4",
    },
    {
      label: "Roles",
      value: stats.roles,
      colorClass: "bg-fuchsia-500",
      textClass: "text-fuchsia-600",
      stroke: "#d946ef",
    },
  ];

  const totalRecords = distribution.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...distribution.map((item) => item.value), 1);

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_35%)] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                  Admin Workspace
                </p>
                <h1 className="mt-3 text-3xl font-bold">Dashboard dieu hanh nhanh</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Tong hop thao tac nhanh, thong ke chinh va hoat dong moi ngay trong mot man hinh.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickOverview.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-3xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${item.className}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Thong ke tong quan</h2>
                <p className="text-sm text-slate-500">So sanh nhanh quy mo tung nhom du lieu trong he thong.</p>
              </div>
              <BarChart3 className="text-slate-400" size={20} />
            </div>

            <SimpleBarChart items={distribution} maxValue={maxValue} />
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Phan bo du lieu</h2>
              <p className="text-sm text-slate-500">Ty le cua tung nhom trong tong {totalRecords} ban ghi.</p>
            </div>

            <DonutChart items={distribution} total={totalRecords} />

            <div className="mt-4 space-y-3">
              {distribution.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${item.colorClass}`} />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className={`font-semibold ${item.textClass}`}>
                    {formatPercent(item.value, totalRecords)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Thao tac nhanh</h2>
                <p className="text-sm text-slate-500">Mo popup them moi ngay tai dashboard.</p>
              </div>
            </div>
            <span className="text-sm text-slate-400">Quick Actions</span>

            {feedback && (
              <div
                className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
                  feedbackType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {feedback}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                onClick={() => openQuickAction("user")}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
              >
                <UserPlus className="text-blue-600" size={22} />
                <div>
                  <p className="font-medium text-slate-800">Them user</p>
                  <p className="text-sm text-slate-500">Tao nguoi dung moi</p>
                </div>
              </button>

              <button
                onClick={() => openQuickAction("subject")}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
              >
                <PlusCircle className="text-green-600" size={22} />
                <div>
                  <p className="font-medium text-slate-800">Them mon hoc</p>
                  <p className="text-sm text-slate-500">Tao subject moi</p>
                </div>
              </button>

              <button
                onClick={() => openQuickAction("class")}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
              >
                <ClipboardList className="text-purple-600" size={22} />
                <div>
                  <p className="font-medium text-slate-800">Them lop</p>
                  <p className="text-sm text-slate-500">Mo popup them lop moi</p>
                </div>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <button
                onClick={() => openQuickAction("faculty")}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
              >
                <Building2 className="text-rose-600" size={22} />
                <div>
                  <p className="font-medium text-slate-800">Them khoa</p>
                  <p className="text-sm text-slate-500">Mo popup them khoa moi</p>
                </div>
              </button>

              <button
                onClick={() => openQuickAction("academic-year")}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
              >
                <CalendarRange className="text-amber-600" size={22} />
                <div>
                  <p className="font-medium text-slate-800">Them nam hoc</p>
                  <p className="text-sm text-slate-500">Mo popup them nam hoc moi</p>
                </div>
              </button>

              <button
                onClick={() => openQuickAction("role")}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
              >
                <KeyRound className="text-violet-600" size={22} />
                <div>
                  <p className="font-medium text-slate-800">Them vai tro</p>
                  <p className="text-sm text-slate-500">Mo popup them vai tro moi</p>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Chi so bo sung</h2>
              <p className="text-sm text-slate-500">Cac nhom du lieu phu de doi chieu nhanh.</p>
            </div>

            <div className="mt-5 space-y-3">
              {supportCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
                    </div>
                    <Icon className={item.textClass} size={20} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Hoat dong gan day</h2>
            <span className="text-sm text-slate-400">Recent Activity</span>
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <span className="text-sm text-slate-400">
                    {new Date(item.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Chua co hoat dong nao</p>
            )}
          </div>
        </div>
      </div>

      <AddUserModal
        open={openUserModal}
        submitting={submitting}
        formData={userForm}
        onClose={closeAllModals}
        onChange={(field, value) =>
          setUserForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleAddUser}
      />

      <AddSubjectModal
        open={openSubjectModal}
        submitting={submitting}
        formData={subjectForm}
        faculties={faculties}
        onClose={closeAllModals}
        onChange={(field, value) =>
          setSubjectForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleAddSubject}
      />

      <AddClassModal
        open={openClassModal}
        submitting={submitting}
        faculties={faculties}
        academicYears={academicYears}
        formData={classForm}
        onClose={closeAllModals}
        onChange={(field, value) =>
          setClassForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={handleAddClass}
      />

      <SimpleNameModal
        open={openFacultyModal}
        title="Them khoa"
        description="Nhap thong tin khoa moi"
        label="Ten khoa"
        placeholder="Nhap ten khoa"
        submitLabel="Them khoa"
        accentClassName="bg-rose-600"
        submitting={submitting}
        value={facultyForm.name}
        onChange={(value) => setFacultyForm({ name: value })}
        onClose={closeAllModals}
        onSubmit={handleAddFaculty}
      />

      <SimpleNameModal
        open={openAcademicYearModal}
        title="Them nam hoc"
        description="Nhap thong tin nam hoc moi"
        label="Ten nam hoc"
        placeholder="Nhap ten nam hoc"
        submitLabel="Them nam hoc"
        accentClassName="bg-amber-600"
        submitting={submitting}
        value={academicYearForm.name}
        onChange={(value) => setAcademicYearForm({ name: value })}
        onClose={closeAllModals}
        onSubmit={handleAddAcademicYear}
      />

      <SimpleNameModal
        open={openRoleModal}
        title="Them vai tro"
        description="Nhap thong tin vai tro moi"
        label="Ten vai tro"
        placeholder="Nhap ten vai tro"
        submitLabel="Them vai tro"
        accentClassName="bg-violet-600"
        submitting={submitting}
        value={roleForm.name}
        onChange={(value) => setRoleForm({ name: value })}
        onClose={closeAllModals}
        onSubmit={handleAddRole}
      />
    </>
  );
}
