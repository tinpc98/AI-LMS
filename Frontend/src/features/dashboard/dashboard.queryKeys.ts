// Query key factory cho Admin Dashboard — tránh hard-code string array rải rác,
// tập trung một chỗ để tránh lỗi gõ nhầm key khi invalidateQueries/refetch.
export const dashboardQueryKeys = {
  overview: ["admin-dashboard"] as const,
  teacher: ["teacher-dashboard"] as const,
};
