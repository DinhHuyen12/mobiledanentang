"use client";

import api from "@/lib/api";

export type GradePreview = {
  attendance_score: number;
  midterm_score: number;
  final_score: number;
  total_score: number;
  letter_grade: string;
};

export async function calculateGradePreview(
  attendance_score: number,
  midterm_score: number,
  final_score: number
): Promise<GradePreview> {
  const response = await api.post("/grades/calculate", {
    attendance_score,
    midterm_score,
    final_score,
  });

  const payload = response.data?.data || response.data;

  return {
    attendance_score: Number(payload?.attendance_score ?? 0),
    midterm_score: Number(payload?.midterm_score ?? 0),
    final_score: Number(payload?.final_score ?? 0),
    total_score: Number(payload?.total_score ?? 0),
    letter_grade: String(payload?.letter_grade || ""),
  };
}
