import axiosClient from "../api/axiosClient";
import type { Subject } from "../types";

export const getSubjectsApi = async (): Promise<Subject[]> => {
  const res = await axiosClient.get<Subject[]>("/subjects");
  return res.data ?? [];
};

export const createSubjectApi = async (payload: {
  id?: string;
  name: string;
  code: string;
  credits: number;
  departmentId: string;
  description?: string;
}): Promise<Subject> => {
  const res = await axiosClient.post<Subject>("/subjects", payload);
  return res.data;
};

export const updateSubjectApi = async (
  id: string,
  payload: {
    name: string;
    code: string;
    credits: number;
    departmentId: string;
    description?: string;
  }
): Promise<Subject> => {
  const res = await axiosClient.put<Subject>(`/subjects/${id}`, payload);
  return res.data;
};

export const deleteSubjectApi = async (id: string): Promise<void> => {
  await axiosClient.delete(`/subjects/${id}`);
};
