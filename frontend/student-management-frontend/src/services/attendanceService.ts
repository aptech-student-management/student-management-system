import axiosClient from "../api/axiosClient";
import type { Attendance } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AttendanceApi = {
  id: string;
  studentId: string;
  courseSectionId: string;
  date: string;
  status: Attendance["status"];
};

const toAttendance = (a: AttendanceApi): Attendance => ({
  id: a.id,
  studentId: a.studentId,
  courseSectionId: a.courseSectionId,
  date: a.date,
  status: a.status
});

export const getAttendanceApi = async (params?: {
  studentId?: string;
  courseSectionId?: string;
  date?: string;
}): Promise<Attendance[]> => {
  const res = await axiosClient.get<ApiResponse<AttendanceApi[]>>("/attendance", { params });
  return (res.data.data ?? []).map(toAttendance);
};

export const upsertAttendanceApi = async (payload: {
  studentId: string;
  courseSectionId: string;
  date: string;
  status: Attendance["status"];
}): Promise<Attendance> => {
  const res = await axiosClient.post<ApiResponse<AttendanceApi>>("/attendance", payload);
  return toAttendance(res.data.data);
};
