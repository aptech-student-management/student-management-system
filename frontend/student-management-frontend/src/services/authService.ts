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

export const checkEmailExists = async (
  email: string
): Promise<boolean> => {

  const res = await axiosClient.get("/auth/check-email", {
    params: { email }
  });

  return res.data.exists;
};
