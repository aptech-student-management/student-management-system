import axiosClient from "../api/axiosClient";

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