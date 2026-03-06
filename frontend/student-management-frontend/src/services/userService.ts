import axiosClient from "../api/axiosClient";
import type { User } from "../types";

type UserProfileResponse = {
  id: string | number;
  name: string;
  email: string;
  role: User["role"];
  phone?: string;
  studentId?: string;
  lecturerId?: string;
  departmentId?: string;
  classId?: string;
  avatarUrl?: string;
  createdAt?: string;
  status?: User["status"];
};

const toUser = (u: UserProfileResponse): User => ({
  id: String(u.id),
  name: u.name,
  email: u.email,
  password: "",
  role: u.role,
  phone: u.phone,
  studentId: u.studentId,
  lecturerId: u.lecturerId,
  departmentId: u.departmentId,
  classId: u.classId,
  avatar: u.avatarUrl,
  createdAt: u.createdAt ?? new Date().toISOString().split("T")[0],
  status: u.status ?? "ACTIVE"
});

export const getUsersApi = async (): Promise<User[]> => {
  const res = await axiosClient.get<{ success: boolean; message: string; data: UserProfileResponse[] }>("/users");
  return (res.data.data ?? []).map(toUser);
};

export const getMyProfileApi = async (): Promise<User> => {
  const res = await axiosClient.get<UserProfileResponse>("/users/me");
  return toUser(res.data);
};

export const updateProfileApi = (data: {
  name: string;
  email: string;
  phone?: string;
}) => {
  return axiosClient.put("/users/me", data);
};

export const changePasswordApi = (data: {
  oldPassword: string;
  newPassword: string;
}) => {
  return axiosClient.put("/users/change-password", data);
};

export const uploadAvatarApi = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return axiosClient.put("/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};