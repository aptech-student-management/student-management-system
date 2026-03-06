import axiosClient from "../api/axiosClient";
import type { Enrollment } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type EnrollmentApi = {
  id: string;
  studentId: string;
  courseSectionId: string;
  enrolledAt: string;
  status: Enrollment["status"];
};

const toEnrollment = (e: EnrollmentApi): Enrollment => ({
  id: e.id,
  studentId: e.studentId,
  courseSectionId: e.courseSectionId,
  enrolledAt: e.enrolledAt,
  status: e.status
});

export const getEnrollmentsApi = async (params?: {
  studentId?: string;
  courseSectionId?: string;
  status?: Enrollment["status"];
}): Promise<Enrollment[]> => {
  const res = await axiosClient.get<ApiResponse<EnrollmentApi[]>>("/enrollments", { params });
  return (res.data.data ?? []).map(toEnrollment);
};

export const createEnrollmentApi = async (payload: {
  studentId: string;
  courseSectionId: string;
  enrolledAt?: string;
  status?: Enrollment["status"];
}): Promise<Enrollment> => {
  const res = await axiosClient.post<ApiResponse<EnrollmentApi>>("/enrollments", payload);
  return toEnrollment(res.data.data);
};

export const updateEnrollmentApi = async (
  id: string,
  payload: Partial<Pick<Enrollment, "status" | "enrolledAt">>
): Promise<Enrollment> => {
  const res = await axiosClient.put<ApiResponse<EnrollmentApi>>(`/enrollments/${id}`, payload);
  return toEnrollment(res.data.data);
};
