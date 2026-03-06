import axiosClient from "../api/axiosClient";
import type { AuditLog } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type AuditLogApi = {
  id: string;
  userId?: string;
  userName: string;
  action: AuditLog["action"];
  target: string;
  detail: string;
  timestamp: string;
};

const toDisplayTimestamp = (ts: string): string => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;

  const date = d.toLocaleDateString("sv-SE");
  const time = d.toLocaleTimeString("en-GB", { hour12: false });
  return `${date} ${time}`;
};

const toAuditLog = (l: AuditLogApi): AuditLog => ({
  id: l.id,
  userId: l.userId ?? "",
  userName: l.userName,
  action: l.action,
  target: l.target,
  detail: l.detail,
  timestamp: toDisplayTimestamp(l.timestamp)
});

export const getAuditLogsApi = async (params?: {
  action?: string;
  date?: string;
  search?: string;
}): Promise<AuditLog[]> => {
  const res = await axiosClient.get<ApiResponse<AuditLogApi[]>>("/audit-logs", { params });
  return (res.data.data ?? []).map(toAuditLog);
};
