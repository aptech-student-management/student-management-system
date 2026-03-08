export const formatVNDate = (dateStr?: string) => {
  if (!dateStr) return "—";

  const date = new Date(dateStr);

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh"
  });
};