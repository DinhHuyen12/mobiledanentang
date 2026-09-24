"use client";

import { Building2, CalendarRange, GraduationCap, X } from "lucide-react";

type LookupOption = {
  id: number;
  name: string;
};

type ClassForm = {
  name: string;
  faculty_id: number;
  academic_year_id: number;
};

type EditClassModalProps = {
  open: boolean;
  submitting: boolean;
  faculties: LookupOption[];
  academicYears: LookupOption[];
  formData: ClassForm;
  onClose: () => void;
  onChange: (field: keyof ClassForm, value: string | number) => void;
  onSubmit: () => void;
};

export default function EditClassModal({
  open,
  submitting,
  faculties,
  academicYears,
  formData,
  onClose,
  onChange,
  onSubmit,
}: EditClassModalProps) {
  if (!open) return null;

  const hasLookupOptions = faculties.length > 0 && academicYears.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cập nhật lớp học</h2>
            <p className="text-sm text-slate-500">Chỉnh sửa thông tin lớp học</p>
          </div>

          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Tên lớp</label>
            <div className="relative mt-1">
              <GraduationCap
                className="absolute left-3 top-3 text-slate-400"
                size={16}
              />
              <input
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                className="w-full rounded-xl border py-2 pl-10 pr-3"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Khoa</label>
            <div className="relative mt-1">
              <Building2
                className="absolute left-3 top-3 text-slate-400"
                size={16}
              />
              {hasLookupOptions ? (
                <select
                  value={formData.faculty_id || ""}
                  onChange={(e) => onChange("faculty_id", Number(e.target.value))}
                  className="w-full rounded-xl border py-2 pl-10 pr-3"
                >
                  <option value="">Chọn khoa</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={formData.faculty_id || ""}
                  onChange={(e) => onChange("faculty_id", Number(e.target.value))}
                  className="w-full rounded-xl border py-2 pl-10 pr-3"
                  placeholder="Nhập faculty_id"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Năm học</label>
            <div className="relative mt-1">
              <CalendarRange
                className="absolute left-3 top-3 text-slate-400"
                size={16}
              />
              {hasLookupOptions ? (
                <select
                  value={formData.academic_year_id || ""}
                  onChange={(e) =>
                    onChange("academic_year_id", Number(e.target.value))
                  }
                  className="w-full rounded-xl border py-2 pl-10 pr-3"
                >
                  <option value="">Chọn năm học</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={formData.academic_year_id || ""}
                  onChange={(e) =>
                    onChange("academic_year_id", Number(e.target.value))
                  }
                  className="w-full rounded-xl border py-2 pl-10 pr-3"
                  placeholder="Nhập academic_year_id"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Hủy
          </button>

          <button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-white"
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
