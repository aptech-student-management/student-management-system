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
