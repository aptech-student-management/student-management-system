import axiosClient from "../api/axiosClient";
import type { EarlyWarning } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type EarlyWarningApi = {
  studentId: string;
  studentName: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  attendanceRate: number;
  averageGpa?: number | null;
  failedCourseCount: number;
  enrolledCourseCount: number;
  recommendations: string[];
};

const toEarlyWarning = (data: EarlyWarningApi): EarlyWarning => ({
  studentId: data.studentId,
  studentName: data.studentName,
  riskScore: data.riskScore,
  riskLevel: data.riskLevel,
  attendanceRate: data.attendanceRate,
  averageGpa: data.averageGpa,
  failedCourseCount: data.failedCourseCount,
  enrolledCourseCount: data.enrolledCourseCount,
  recommendations: data.recommendations ?? []
});

export const getEarlyWarningApi = async (studentId: string): Promise<EarlyWarning> => {
  const res = await axiosClient.get<ApiResponse<EarlyWarningApi>>("/ai/early-warning", {
    params: { studentId }
  });

  return toEarlyWarning(res.data.data);
};
