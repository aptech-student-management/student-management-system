import axiosClient from "../api/axiosClient";
import type { CourseSection } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const getCourseSectionsApi = async (): Promise<CourseSection[]> => {
  const res = await axiosClient.get<ApiResponse<CourseSection[]>>("/course-sections");
  return res.data.data ?? [];
};

export const createCourseSectionApi = async (payload: {
  id?: string;
  subjectId: string;
  semesterId: string;
  lecturerId: string;
  classId: string;
  schedule: string;
  room: string;
  maxStudents: number;
  enrolledCount?: number;
  status: CourseSection["status"];
}): Promise<CourseSection> => {
  const res = await axiosClient.post<ApiResponse<CourseSection>>("/course-sections", payload);
  return res.data.data;
};

export const updateCourseSectionApi = async (
  id: string,
  payload: {
    subjectId: string;
    semesterId: string;
    lecturerId: string;
    classId: string;
    schedule: string;
    room: string;
    maxStudents: number;
    enrolledCount?: number;
    status: CourseSection["status"];
  }
): Promise<CourseSection> => {
  const res = await axiosClient.put<ApiResponse<CourseSection>>(`/course-sections/${id}`, payload);
  return res.data.data;
};

export const deleteCourseSectionApi = async (id: string): Promise<void> => {
  await axiosClient.delete(`/course-sections/${id}`);
};
