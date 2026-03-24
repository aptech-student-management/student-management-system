import axiosClient from "../api/axiosClient";
import type { Class } from "../types";

export const getClassesApi = async (): Promise<Class[]> => {
  const res = await axiosClient.get<Class[]>("/classes");
  return res.data ?? [];
};

export const createClassApi = async (payload: {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  year: number;
  studentCount?: number;
}): Promise<Class> => {
  const res = await axiosClient.post<Class>("/classes", payload);
  return res.data;
};

export const updateClassApi = async (
  id: string,
  payload: {
    name: string;
    code: string;
    departmentId: string;
    year: number;
    studentCount?: number;
  }
): Promise<Class> => {
  const res = await axiosClient.put<Class>(`/classes/${id}`, payload);
  return res.data;
};

export const deleteClassApi = async (id: string): Promise<void> => {
  await axiosClient.delete(`/classes/${id}`);
};

export const addStudentToClassApi = (classId: string, studentId: number) =>
  axiosClient.put(`/classes/${classId}/students/${studentId}`)

export const removeStudentFromClassApi = (classId: string, studentId: number) =>
  axiosClient.delete(`/classes/${classId}/students/${studentId}`)
