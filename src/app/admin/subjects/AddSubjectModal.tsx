"use client";

import { X, BookOpen, Hash, Building2 } from "lucide-react";

type SubjectForm = {
  subject_code: string;
  name: string;
  credits: number;
  faculty_id: number;
};

type FacultyOption = {
  id: number;
  name?: string;
};

type Props = {
  open: boolean;
  submitting: boolean;
  formData: SubjectForm;
  faculties: FacultyOption[];
  onClose: () => void;
  onChange: (field: keyof SubjectForm, value: string | number) => void;
  onSubmit: () => void;
};

export default function AddSubjectModal({
  open,
  submitting,
  formData,
  faculties,
  onClose,
  onChange,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Them mon hoc</h2>
            <p className="text-sm text-slate-500">Nhap thong tin mon hoc moi</p>
          </div>

          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Ma mon</label>
            <div className="relative mt-1">
              <BookOpen className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                value={formData.subject_code}
                onChange={(e) => onChange("subject_code", e.target.value)}
                className="w-full rounded-xl border py-2 pl-10"
                placeholder="VD: IT101"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Ten mon</label>
            <input
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="Nhap ten mon"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tin chi</label>
            <div className="relative mt-1">
              <Hash className="absolute left-3 top-3 text-slate-400" size={16} />
              <input
                type="number"
                min="0"
                value={formData.credits}
                onChange={(e) => onChange("credits", Number(e.target.value))}
                className="w-full rounded-xl border py-2 pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Khoa</label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-3 text-slate-400" size={16} />
              <select
                value={formData.faculty_id || ""}
                onChange={(e) => onChange("faculty_id", Number(e.target.value))}
                className="w-full rounded-xl border py-2 pl-10 pr-3"
              >
                <option value="">Chon khoa</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name || `Khoa ${faculty.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Huy
          </button>

          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
          >
            {submitting ? "Dang them..." : "Them"}
          </button>
        </div>
      </div>
    </div>
  );
}
