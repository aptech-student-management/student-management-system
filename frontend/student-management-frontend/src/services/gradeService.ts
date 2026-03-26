import axiosClient from "../api/axiosClient";
import type { Grade } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type GradeApi = {
  id: string;
  studentId: string;
  courseSectionId: string;
  midterm?: number;
  finalScore?: number;
  attendanceScore?: number;
  totalScore?: number;
  letterGrade?: string;
  gpaPoint?: number;
  updatedBy?: string;
  updatedAt?: string;
};

export type GradeImportRow = {
  rowNumber: number;
  studentId: string;
  studentName?: string;
  attendanceScore?: number;
  midterm?: number;
  finalScore?: number;
  totalScore?: number;
  letterGrade?: string;
  gpaPoint?: number;
  operation: "CREATE" | "UPDATE";
  ready: boolean;
  issues: string[];
};

export type GradeImportPreview = {
  courseSectionId: string;
  rows: GradeImportRow[];
  totalRows: number;
  readyRows: number;
  createCount: number;
  updateCount: number;
};

const toGrade = (g: GradeApi): Grade => ({
  id: g.id,
  studentId: g.studentId,
  courseSectionId: g.courseSectionId,
  midterm: g.midterm,
  final: g.finalScore,
  attendanceScore: g.attendanceScore,
  totalScore: g.totalScore,
  letterGrade: g.letterGrade,
  gpaPoint: g.gpaPoint,
  updatedBy: g.updatedBy,
  updatedAt: g.updatedAt
});

export const getGradesApi = async (params?: {
  studentId?: string;
  courseSectionId?: string;
}): Promise<Grade[]> => {
  const res = await axiosClient.get<ApiResponse<GradeApi[]>>("/grades", { params });
  return (res.data.data ?? []).map(toGrade);
};

export const upsertGradeApi = async (payload: {
  studentId: string;
  courseSectionId: string;
  midterm?: number;
  finalScore?: number;
  attendanceScore?: number;
  totalScore?: number;
  letterGrade?: string;
  gpaPoint?: number;
  updatedBy?: string;
}): Promise<Grade> => {
  const res = await axiosClient.post<ApiResponse<GradeApi>>("/grades", payload);
  return toGrade(res.data.data);
};

export const previewGradeImportApi = async (
  file: File,
  courseSectionId: string
): Promise<GradeImportPreview> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("courseSectionId", courseSectionId);

  const res = await axiosClient.post<ApiResponse<GradeImportPreview>>(
    "/grades/imports/preview",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000
    }
  );

  return {
    ...res.data.data,
    rows: (res.data.data?.rows ?? []).map((row) => ({
      rowNumber: row.rowNumber,
      studentId: row.studentId ?? "",
      studentName: row.studentName ?? undefined,
      attendanceScore: row.attendanceScore ?? undefined,
      midterm: row.midterm ?? undefined,
      finalScore: row.finalScore ?? undefined,
      totalScore: row.totalScore ?? undefined,
      letterGrade: row.letterGrade ?? undefined,
      gpaPoint: row.gpaPoint ?? undefined,
      operation: row.operation,
      ready: row.ready,
      issues: row.issues ?? []
    }))
  };
};

export const applyGradeImportApi = async (payload: {
  courseSectionId: string;
  rows: GradeImportRow[];
}): Promise<{
  createdCount: number;
  updatedCount: number;
  totalCount: number;
}> => {
  const res = await axiosClient.post<ApiResponse<{
    createdCount: number;
    updatedCount: number;
    totalCount: number;
  }>>("/grades/imports/apply", payload);

  return res.data.data;
};
