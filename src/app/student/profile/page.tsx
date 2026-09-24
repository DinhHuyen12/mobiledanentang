"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Mail,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { loadStudentPortalData, StudentInfo } from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";

type StudentDocumentItem = {
  id: number;
  document_type?: string;
  title?: string;
  note?: string;
  original_name?: string;
  mime_type?: string;
  file_size?: number;
  file_url?: string;
  created_at?: string;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10) || "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatFileSize(value?: number) {
  const size = Number(value || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentProfilePage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [documents, setDocuments] = useState<StudentDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [documentType, setDocumentType] = useState("hoso");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentNote, setDocumentNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useToastMessage(error, "error");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [portalData, documentsRes] = await Promise.all([
        loadStudentPortalData(),
        api.get("/student-info/me/documents"),
      ]);

      const nextDocuments = Array.isArray(documentsRes.data) ? documentsRes.data : [];

      setStudentInfo(portalData.studentInfo);
      setDocuments(
        [...(nextDocuments as StudentDocumentItem[])].sort((left, right) =>
          String(right.created_at || "").localeCompare(String(left.created_at || ""))
        )
      );
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không tải được hồ sơ sinh viên");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Không tải được hồ sơ sinh viên");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 5);
    setSelectedFiles(files);
  };

  const handleUploadDocuments = async () => {
    if (!studentInfo?.id || uploading) return;

    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất một file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("document_type", documentType.trim() || "hoso");
      if (documentTitle.trim()) formData.append("title", documentTitle.trim());
      if (documentNote.trim()) formData.append("note", documentNote.trim());

      await api.post(`/student-info/${studentInfo.id}/documents`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Tải lên minh chứng thành công");
      setSelectedFiles([]);
      setDocumentType("hoso");
      setDocumentTitle("");
      setDocumentNote("");
      await fetchProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Tải lên minh chứng thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Tải lên minh chứng thất bại");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (deletingId || !window.confirm("Bạn có chắc muốn xóa tài liệu này không?")) return;

    try {
      setDeletingId(documentId);
      await api.delete(`/student-info/documents/${documentId}`);
      toast.success("Đã xóa tài liệu");
      await fetchProfile();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Xóa tài liệu thất bại");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Xóa tài liệu thất bại");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const profileItems = useMemo(
    () => [
      { label: "Họ tên", value: studentInfo?.full_name || "-", icon: UserRound },
      { label: "Email", value: studentInfo?.email || "-", icon: Mail },
      { label: "Username", value: studentInfo?.username || "-", icon: UserRound },
      { label: "Lớp", value: studentInfo?.class_name || "-", icon: ShieldCheck },
      {
        label: "Ngày nhập học",
        value: formatDate(studentInfo?.enrollment_date),
        icon: CalendarDays,
      },
      { label: "Trạng thái", value: studentInfo?.status || "-", icon: ShieldCheck },
    ],
    [studentInfo]
  );

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải hồ sơ sinh viên...</div>;
  }

  if (error) {
    return <div className="rounded-3xl bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!studentInfo) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Chưa có hồ sơ sinh viên</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tài khoản này chưa được liên kết với bảng `student_info`.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Hồ sơ sinh viên</p>
        <h1 className="mt-3 text-3xl font-bold">
          {studentInfo.full_name || studentInfo.username || "Sinh viên"}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Xem thông tin cá nhân và quản lý minh chứng, hồ sơ đã tải lên.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {profileItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Icon size={20} />
              </div>
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Upload minh chứng / hồ sơ</h2>
              <p className="text-sm text-slate-500">
                Hỗ trợ tối đa 5 file, mỗi file tối đa 10MB.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Loại tài liệu</label>
              <select
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              >
                <option value="hoso">Hồ sơ</option>
                <option value="minhchung">Minh chứng</option>
                <option value="giayto">Giấy tờ</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Tiêu đề</label>
              <input
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2"
                placeholder="Ví dụ: CCCD, bảng điểm THPT, đơn xác nhận..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Ghi chú</label>
              <textarea
                value={documentNote}
                onChange={(event) => setDocumentNote(event.target.value)}
                className="mt-1 min-h-28 w-full rounded-xl border px-3 py-2"
                placeholder="Mô tả ngắn về tài liệu"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Chọn file</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </div>

            {selectedFiles.length > 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                {selectedFiles.map((file) => (
                  <p key={`${file.name}-${file.size}`}>
                    {file.name} ({formatFileSize(file.size)})
                  </p>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleUploadDocuments()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
            >
              <Upload size={16} />
              {uploading ? "Đang tải lên..." : "Tải lên tài liệu"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Tài liệu đã tải lên</h2>
              <p className="text-sm text-slate-500">
                Danh sách minh chứng và hồ sơ của sinh viên.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {documents.length > 0 ? (
              documents.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.title || item.original_name || `Tài liệu #${item.id}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>Loại: {item.document_type || "-"}</span>
                        <span>Kích thước: {formatFileSize(item.file_size)}</span>
                        <span>Ngày tải: {formatDate(item.created_at)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{item.note || "Không có ghi chú."}</p>
                      {item.file_url ? (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, "") || "http://localhost:5000"}${item.file_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-sm font-medium text-sky-700 hover:text-sky-800"
                        >
                          Mở tài liệu
                        </a>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDocument(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Bạn chưa tải lên tài liệu nào.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
