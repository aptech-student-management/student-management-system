import axiosClient from "../api/axiosClient";
import type { Department } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const getDepartmentsApi = async (): Promise<Department[]> => {
  const res = await axiosClient.get<ApiResponse<Department[]>>("/departments");
  return res.data.data ?? [];
};

export const createDepartmentApi = async (payload: {
  name: string;
  code: string;
  description?: string;
  headLecturerId?: string;
}): Promise<Department> => {
  const res = await axiosClient.post<ApiResponse<Department>>("/departments", payload);
  return res.data.data;
};

export const updateDepartmentApi = async (
  id: string,
  payload: {
    name: string;
    code: string;
    description?: string;
    headLecturerId?: string;
  }
): Promise<Department> => {
  const res = await axiosClient.put<ApiResponse<Department>>(`/departments/${id}`, payload);
  return res.data.data;
};

export const deleteDepartmentApi = async (id: string): Promise<void> => {
  await axiosClient.delete(`/departments/${id}`);
};
