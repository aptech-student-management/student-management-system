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
  phone: u.phone ?? undefined,
  studentId: u.studentId ?? undefined,
  lecturerId: u.lecturerId ?? undefined,
  departmentId: u.departmentId != null ? String(u.departmentId) : undefined,
  classId: u.classId != null ? String(u.classId) : undefined,
  avatar: u.avatarUrl ?? undefined,
  createdAt: u.createdAt ?? new Date().toISOString().split("T")[0],
  status: u.status ?? "ACTIVE"
});

export type StudentImportRow = {
  rowNumber: number;
  name: string;
  email: string;
  role: Extract<Role, "STUDENT" | "LECTURER">;
  studentId: string;
  departmentId?: string;
  phone?: string;
  operation: "CREATE" | "UPDATE";
  ready: boolean;
  issues: string[];
};

export type StudentImportPreview = {
  rows: StudentImportRow[];
  totalRows: number;
  readyRows: number;
  createCount: number;
  updateCount: number;
};

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

export const previewAdminStudentImportApi = async (
  file: File,
  defaultRole: Extract<Role, "STUDENT" | "LECTURER">
): Promise<StudentImportPreview> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("defaultRole", defaultRole);

  const res = await axiosClient.post<ApiResponse<StudentImportPreview>>(
    "/admin/user-imports/preview",
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
      name: row.name ?? "",
      email: row.email ?? "",
      role: row.role === "LECTURER" ? "LECTURER" : row.role === "STUDENT" ? "STUDENT" : defaultRole,
      studentId: row.studentId ?? "",
      departmentId: row.departmentId ?? undefined,
      phone: row.phone ?? undefined,
      operation: row.operation,
      ready: row.ready,
      issues: row.issues ?? []
    }))
  };
};

export const applyAdminStudentImportApi = async (payload: {
  rows: StudentImportRow[];
  defaultPassword?: string;
}): Promise<{
  createdCount: number;
  updatedCount: number;
  totalCount: number;
}> => {
  const res = await axiosClient.post<ApiResponse<{
    createdCount: number;
    updatedCount: number;
    totalCount: number;
  }>>("/admin/user-imports/apply", payload);

  return res.data.data;
};
