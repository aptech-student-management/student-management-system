import axiosClient from "../api/axiosClient";

export const registerApi = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  departmentId: string;
  phone?: string;
  studentId?: string;
}) => {
  return axiosClient.post("/auth/register", data);
};
export const loginApi = (email: string, password: string) => {
  return axiosClient.post("/auth/login", { email, password });
};