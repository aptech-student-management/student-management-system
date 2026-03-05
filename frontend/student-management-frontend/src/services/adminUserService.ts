import axiosClient from "../api/axiosClient";
import type { Role, User } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AdminUserPayload = {
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  phone?: string;
  studentId?: string;
  password?: string;
};

const toUser = (u: any): User => ({
  id: String(u.id),
  name: u.name,
  email: u.email,
  password: "",
  role: u.role,
  phone: u.phone,
  studentId: u.studentId,
  departmentId: u.departmentId,
  createdAt: u.createdAt ?? new Date().toISOString().split("T")[0],
  status: "ACTIVE"
});

export const getAdminUsersApi = async (): Promise<User[]> => {
  const res = await axiosClient.get<ApiResponse<any[]>>("/admin/users");
  return (res.data.data ?? []).map(toUser);
};

export const createAdminUserApi = async (payload: AdminUserPayload): Promise<User> => {
  const normalizedPayload = {
    ...payload,
    departmentId: payload.departmentId || null,
    phone: payload.phone || null,
    studentId: payload.studentId || null
  };

  const res = await axiosClient.post<ApiResponse<any>>("/admin/users", normalizedPayload);
  return toUser(res.data.data);
};

export const updateAdminUserApi = async (id: string, payload: AdminUserPayload): Promise<User> => {
  const normalizedPayload = {
    ...payload,
    departmentId: payload.departmentId || null,
    phone: payload.phone || null,
    studentId: payload.studentId || null
  };

  const res = await axiosClient.put<ApiResponse<any>>(`/admin/users/${id}`, normalizedPayload);
  return toUser(res.data.data);
};

export const deleteAdminUserApi = async (id: string): Promise<void> => {
  await axiosClient.delete(`/admin/users/${id}`);
};
