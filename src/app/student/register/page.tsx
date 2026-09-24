"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CalendarDays, Search, UserRound } from "lucide-react";
import api from "@/lib/api";
import { BackendScheduleItem, formatScheduleTime, getScheduleDayLabel } from "@/lib/schedules";
import {
  CourseSectionItem,
  getCollection,
  getEnrollmentTypeClassName,
  getEnrollmentTypeFromBestScore,
  getEnrollmentTypeLabel,
  isCancelledEnrollmentStatus,
  isStudentRegistrationType,
  loadStudentPortalData,
  resolveEnrollmentType,
  StudentInfo,
} from "@/lib/student-portal";
import { useToastMessage } from "@/hooks/use-toast-message";
import ConfirmDialog from "@/components/app/confirm-dialog";

type PrerequisiteItem = {
  subject_id?: number;
  subject_name?: string;
  prerequisite_id?: number;
  prerequisite_name?: string;
};

type LecturerInfoItem = {
  id: number;
  full_name?: string;
};

async function getOptionalCollection<T>(request: Promise<{ data: unknown }>) {
  try {
    const response = await request;
    return getCollection(response.data) as T[];
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      return [];
    }
    throw error;
  }
}

export default function StudentRegisterCoursePage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [courseSections, setCourseSections] = useState<CourseSectionItem[]>([]);
  const [registeredSectionIds, setRegisteredSectionIds] = useState<number[]>([]);
  const [registeredSubjectIds, setRegisteredSubjectIds] = useState<number[]>([]);
  const [prerequisites, setPrerequisites] = useState<PrerequisiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [sectionFeedback, setSectionFeedback] = useState<{
    sectionId: number;
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<{
    subjectName: string;
    items: string[];
  } | null>(null);

  useToastMessage(message, messageType);

  const isBlockingEnrollmentStatus = (status?: string) => {
    return !isCancelledEnrollmentStatus(status);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");
      setSectionFeedback(null);

      const [portalData, sectionsRes, prerequisiteList, lecturerList, scheduleList] =
        await Promise.all([
          loadStudentPortalData(),
          api.get("/course-sections"),
          getOptionalCollection<PrerequisiteItem>(api.get("/subject-prerequisites")),
          getOptionalCollection<LecturerInfoItem>(api.get("/lecturer-info")),
          getOptionalCollection<BackendScheduleItem>(api.get("/schedules")),
        ]);

      const sections = getCollection(sectionsRes.data) as CourseSectionItem[];
      const bestScoreBySubjectId = new Map<number, number>();
      const lecturerMap = new Map(
        lecturerList.map((item) => [Number(item.id), item.full_name || `Giang vien #${item.id}`])
      );
      const schedulesBySection = new Map<number, BackendScheduleItem[]>();

      portalData.enrollments.forEach((enrollment) => {
        const subjectId = Number(enrollment.subject_id);
        if (!Number.isFinite(subjectId)) return;

        const matchingGrades = portalData.grades.filter(
          (grade) => Number(grade.enrollment_id) === Number(enrollment.id)
        );

        matchingGrades.forEach((grade) => {
          const totalScore = Number(grade.total_score);
          if (Number.isNaN(totalScore)) return;

          const currentBest = bestScoreBySubjectId.get(subjectId);
          if (currentBest == null || totalScore > currentBest) {
            bestScoreBySubjectId.set(subjectId, totalScore);
          }
        });
      });

      scheduleList.forEach((item) => {
        const sectionId = Number(item.course_section_id);
        if (!Number.isFinite(sectionId)) return;
        const list = schedulesBySection.get(sectionId) || [];
        list.push(item);
        schedulesBySection.set(sectionId, list);
      });

      const enrichedSections = sections.map((item) => {
        const sectionSchedules = schedulesBySection.get(Number(item.id)) || [];
        const scheduleLabel =
          sectionSchedules.length > 0
            ? sectionSchedules
                .map(
                  (schedule) =>
                    `${getScheduleDayLabel(schedule.day_of_week)} ${formatScheduleTime(
                      schedule.start_time
                    )}-${formatScheduleTime(schedule.end_time)}`
                )
                .join(" | ")
            : "";

        const roomLabel =
          sectionSchedules.length > 0
            ? Array.from(new Set(sectionSchedules.map((schedule) => schedule.room).filter(Boolean)))
                .join(", ")
            : "";

        return {
          ...item,
          enrollment_type:
            resolveEnrollmentType(item) !== "hoc_di"
              ? resolveEnrollmentType(item)
              : getEnrollmentTypeFromBestScore(bestScoreBySubjectId.get(Number(item.subject_id))),
          lecturer_name:
            item.lecturer_name ||
            sectionSchedules.find((schedule) => schedule.lecturer_name)?.lecturer_name ||
            lecturerMap.get(Number(item.lecturer_id)) ||
            "",
          schedule: item.schedule || scheduleLabel,
          room: item.room || roomLabel,
        };
      });

      setStudentInfo(portalData.studentInfo);
      setCourseSections(enrichedSections);
      setPrerequisites(prerequisiteList);
      setRegisteredSectionIds(
        portalData.enrollments
          .filter((item) => isBlockingEnrollmentStatus(item.status))
          .map((item) => Number(item.course_section_id))
          .filter((value) => Number.isFinite(value))
      );
      setRegisteredSubjectIds(
        portalData.enrollments
          .filter((item) => isBlockingEnrollmentStatus(item.status))
          .map((item) => Number(item.subject_id))
          .filter((value) => Number.isFinite(value))
      );
    } catch (error: unknown) {
      setMessageType("error");
      if (axios.isAxiosError(error)) {
        setMessage(error.response?.data?.message || "Không tải được danh sách học phần");
      } else if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Không tải được danh sách học phần");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSections = useMemo(() => {
    const lowerKeyword = keyword.toLowerCase();

    const filtered = courseSections.filter((item) => {
      if (!isStudentRegistrationType(item)) return false;

      const subject = (item.subject_name || item.subject || "").toLowerCase();
      const semester = (item.semester_name || item.semester || "").toLowerCase();
      const lecturer = (item.lecturer_name || item.lecturer || "").toLowerCase();
      const room = (item.room || "").toLowerCase();
      const schedule = (item.schedule || "").toLowerCase();

      return (
        subject.includes(lowerKeyword) ||
        semester.includes(lowerKeyword) ||
        lecturer.includes(lowerKeyword) ||
        room.includes(lowerKeyword) ||
        schedule.includes(lowerKeyword)
      );
    });

    const uniqueSections = new Map<number, CourseSectionItem>();
    filtered.forEach((item) => {
      const sectionId = Number(item.id);
      if (!Number.isFinite(sectionId) || uniqueSections.has(sectionId)) return;
      uniqueSections.set(sectionId, item);
    });

    return Array.from(uniqueSections.values());
  }, [courseSections, keyword]);

  const stats = useMemo(
    () => ({
      hocLai: filteredSections.filter((item) => resolveEnrollmentType(item) === "hoc_lai").length,
      hocCaiThien: filteredSections.filter(
        (item) => resolveEnrollmentType(item) === "hoc_cai_thien"
      ).length,
    }),
    [filteredSections]
  );

  const handleRegister = async (courseSectionId: number) => {
    if (!studentInfo?.id || submittingId) return;

    const selectedSection = courseSections.find(
      (item) => Number(item.id) === Number(courseSectionId)
    );
    const enrollmentType = resolveEnrollmentType(selectedSection);

    if (!isStudentRegistrationType(enrollmentType)) {
      setSectionFeedback({
        sectionId: courseSectionId,
        type: "error",
        message: "Sinh vien chi duoc dang ky hoc lai hoac hoc cai thien.",
      });
      return;
    }

    try {
      setSubmittingId(courseSectionId);
      setMessage("");
      setMessageType("");
      setSectionFeedback(null);

      const response = await api.post("/enrollments", {
        student_id: Number(studentInfo.id),
        course_section_id: Number(courseSectionId),
        enrollment_type: enrollmentType,
      });

      const payload = response.data as {
        data?: {
          enrollment_type?: string;
          is_retake?: boolean;
          is_improvement?: boolean;
        };
      };
      const savedEnrollmentType = resolveEnrollmentType(payload.data || enrollmentType);
      const registeredSection = courseSections.find(
        (item) => Number(item.id) === Number(courseSectionId)
      );
      setRegisteredSectionIds((prev) => [...prev, courseSectionId]);
      if (registeredSection?.subject_id) {
        setRegisteredSubjectIds((prev) =>
          prev.includes(Number(registeredSection.subject_id))
            ? prev
            : [...prev, Number(registeredSection.subject_id)]
        );
      }
      setSectionFeedback({
        sectionId: courseSectionId,
        type: "success",
        message: `Da gui dang ky ${getEnrollmentTypeLabel(savedEnrollmentType).toLowerCase()}, cho admin duyet.`,
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setSectionFeedback({
          sectionId: courseSectionId,
          type: "error",
          message: error.response?.data?.message || "Dang ky hoc phan that bai",
        });
      } else {
        setSectionFeedback({
          sectionId: courseSectionId,
          type: "error",
          message: "Dang ky hoc phan that bai",
        });
      }
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Đang tải danh sách học phần...</div>;
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
      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-white/70">Đăng ký học phần</p>
        <h1 className="mt-3 text-3xl font-bold">Đăng ký học phần</h1>
        <p className="mt-2 text-sm text-white/80">
          Chọn lớp học phần phù hợp và đăng ký trực tiếp bằng tài khoản sinh viên.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-sm text-rose-700">Hoc lai</p>
            <p className="mt-2 text-2xl font-bold text-rose-900">{stats.hocLai}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Hoc cai thien</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{stats.hocCaiThien}</p>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Tìm theo môn học, học kỳ, giảng viên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white py-2 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="text-sm text-slate-500">
            Có thể đăng ký:{" "}
            <span className="font-semibold text-slate-700">{filteredSections.length}</span>
          </div>
        </div>

        {message && !sectionFeedback && (
          <div
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => {
              const registered =
                typeof section.is_registered === "boolean"
                  ? section.is_registered
                  : registeredSectionIds.includes(Number(section.id));
              const alreadyRegisteredSubject =
                typeof section.is_registered === "boolean"
                  ? false
                  : registeredSubjectIds.includes(Number(section.subject_id));
              const subjectPrerequisites = prerequisites.filter(
                (item) =>
                  String(item.subject_name || "").trim().toLowerCase() ===
                  String(section.subject_name || section.subject || "").trim().toLowerCase()
              );
              const lecturerLabel =
                section.lecturer_name ||
                section.lecturer ||
                (section.lecturer_id ? `Giang vien ID #${section.lecturer_id}` : "");
              const hasSchedule = Boolean(section.schedule);
              const hasRoom = Boolean(section.room);

              return (
                <div
                  key={section.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {section.subject_name || section.subject || `Hoc phan ${section.id}`}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {section.semester_name || section.semester || "Chua co hoc ky"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getEnrollmentTypeClassName(section)}`}>
                          {getEnrollmentTypeLabel(section)}
                        </span>
                        {resolveEnrollmentType(section) === "hoc_lai" ? (
                          <span className="text-xs text-slate-500">Mon nay co diem truot truoc do.</span>
                        ) : null}
                        {resolveEnrollmentType(section) === "hoc_cai_thien" ? (
                          <span className="text-xs text-slate-500">Mon nay co the dang ky de cai thien diem.</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      Section #{section.id}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600">
                    {lecturerLabel && (
                      <div className="flex items-center gap-2">
                        <UserRound size={16} className="text-slate-400" />
                        {lecturerLabel}
                      </div>
                    )}
                    {hasSchedule && (
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-slate-400" />
                        {section.schedule}
                      </div>
                    )}
                    {hasRoom && (
                        <div className="flex items-center gap-2">
                          <BookOpenCheck size={16} className="text-slate-400" />
                        Phòng: {section.room}
                        </div>
                    )}
                    {!hasSchedule && !hasRoom && (
                      <div className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-500">
                        Backend hiện chưa trả về lịch học và phòng cho lớp học phần này.
                      </div>
                    )}
                    {sectionFeedback?.sectionId === Number(section.id) ? (
                      <div
                        className={`rounded-2xl px-3 py-2 text-xs ${
                          sectionFeedback.type === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {sectionFeedback.message}
                      </div>
                    ) : null}
                    {subjectPrerequisites.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPrerequisites({
                            subjectName: section.subject_name || section.subject || `Học phần ${section.id}`,
                            items: subjectPrerequisites
                              .map((item) => item.prerequisite_name || "")
                              .filter(Boolean),
                          })
                        }
                        className="rounded-2xl bg-amber-50 px-3 py-2 text-left text-xs text-amber-700 transition hover:bg-amber-100"
                      >
                        Tiên quyết: {subjectPrerequisites.map((item) => item.prerequisite_name).filter(Boolean).join(", ")}
                        <div className="mt-1 font-semibold">Bấm để xem chi tiết</div>
                      </button>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      Suc chua:{" "}
                      <span className="font-semibold text-slate-700">
                        {section.max_students ?? "-"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRegister(section.id)}
                      disabled={registered || alreadyRegisteredSubject || submittingId === section.id}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                        registered || alreadyRegisteredSubject
                          ? "cursor-not-allowed bg-slate-200 text-slate-500"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {registered
                        ? "Đã đăng ký"
                        : submittingId === section.id
                          ? "Đang xử lý..."
                          : "Đăng ký ngay"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 lg:col-span-2">
              Khong co hoc phan phu hop de dang ky.
              
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(selectedPrerequisites)}
        title="Chi tiết môn tiên quyết"
        description={
          selectedPrerequisites
            ? `Môn ${selectedPrerequisites.subjectName} yêu cầu hoàn thành trước: ${selectedPrerequisites.items.join(", ")}.`
            : ""
        }
        confirmLabel="Đã hiểu"
        cancelLabel="Đóng"
        onCancel={() => setSelectedPrerequisites(null)}
        onConfirm={() => setSelectedPrerequisites(null)}
      />
    </div>
  );
}
