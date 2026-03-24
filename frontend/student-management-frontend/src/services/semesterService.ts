import axiosClient from "../api/axiosClient";
import type { Semester } from "../types";

type SemesterApi = {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: Semester["status"];
};

const toSemester = (s: SemesterApi): Semester => ({
  id: s.id,
  name: s.name,
  year: s.academicYear,
  startDate: s.startDate,
  endDate: s.endDate,
  status: s.status
});

export const getSemestersApi = async (): Promise<Semester[]> => {
  const res = await axiosClient.get<SemesterApi[]>("/semesters");
  return (res.data ?? []).map(toSemester);
};

export const createSemesterApi = async (payload: {
  id?: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
}): Promise<Semester> => {
  const res = await axiosClient.post<SemesterApi>("/semesters", payload);
  return toSemester(res.data);
};

export const updateSemesterApi = async (
  id: string,
  payload: {
    name: string;
    academicYear: string;
    startDate: string;
    endDate: string;
  }
): Promise<Semester> => {
  const res = await axiosClient.put<SemesterApi>(`/semesters/${id}`, payload);
  return toSemester(res.data);
};

export const deleteSemesterApi = async (id: string): Promise<void> => {
  await axiosClient.delete(`/semesters/${id}`);
};
