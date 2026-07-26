import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, Input, Select, Segmented, Pagination, Alert, Button, Skeleton, Empty, Typography, Space } from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { classApi } from "../../api/classApi";
import { TeacherClassHeader } from "../../components/teacher/classroom/TeacherClassHeader";
import { TeacherClassGrid } from "../../components/teacher/classroom/TeacherClassGrid";
import { TeacherClassListTable } from "../../components/teacher/classroom/TeacherClassListTable";

const { Text } = Typography;

export default function ClassroomManagement() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await classApi.getMyClasses();
      const raw = res.data?.data || res.data?.classList || res.data || [];
      setClasses(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      console.error("[ClassroomManagement] Fetch error:", err);
      setError(err.message || "Không thể tải danh sách lớp học. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter((c) => ["Active", "Ready", "Ongoing", "active"].includes(c.status)).length;
    const completed = classes.filter((c) => ["Completed", "completed"].includes(c.status)).length;
    const totalStudents = classes.reduce((sum, c) => {
      const count = c.currentStudents ?? (Array.isArray(c.students) ? c.students.length : 0);
      return sum + count;
    }, 0);
    return { total, active, completed, totalStudents };
  }, [classes]);

  // Filter & Sort Logic
  const filteredClasses = useMemo(() => {
    let result = [...classes];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.className?.toLowerCase().includes(q) ||
          c.classCode?.toLowerCase().includes(q) ||
          c.joinCode?.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((c) => (c.status || "active").toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name-asc") return a.className.localeCompare(b.className);
      if (sortBy === "name-desc") return b.className.localeCompare(a.className);
      return (b._id || "").localeCompare(a._id || "");
    });

    return result;
  }, [classes, searchQuery, statusFilter, sortBy]);

  // Pagination Slice
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClasses.slice(start, start + pageSize);
  }, [filteredClasses, currentPage, pageSize]);

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* 1. Header Banner & Stats Overview */}
      <TeacherClassHeader
        totalClasses={stats.total}
        activeClasses={stats.active}
        completedClasses={stats.completed}
        totalStudents={stats.totalStudents}
        loading={loading}
      />

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi nạp danh sách lớp học"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={fetchClasses}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      {/* 2. Controls Toolbar (Search, Filter, Sort, View Toggle) */}
      <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} bodyStyle={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          {/* Left: Search input */}
          <Input
            placeholder="Tìm kiếm theo tên lớp hoặc mã tham gia..."
            prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: 320, borderRadius: 8 }}
            allowClear
          />

          {/* Right: Filters, Sorting & View Segmented */}
          <Space size={12} wrap>
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              style={{ width: 160 }}
              suffixIcon={<FilterOutlined />}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "active", label: "Đang hoạt động" },
                { value: "ready", label: "Sắp diễn ra" },
                { value: "completed", label: "Đã kết thúc" },
                { value: "cancelled", label: "Đã đóng" },
              ]}
            />

            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              style={{ width: 140 }}
              options={[
                { value: "newest", label: "Mới nhất" },
                { value: "name-asc", label: "Tên: A -> Z" },
                { value: "name-desc", label: "Tên: Z -> A" },
              ]}
            />

            <Segmented
              options={[
                { value: "grid", icon: <AppstoreOutlined /> },
                { value: "table", icon: <UnorderedListOutlined /> },
              ]}
              value={viewMode}
              onChange={(val) => setViewMode(val as "grid" | "table")}
            />
          </Space>
        </div>
      </Card>

      {/* 3. Main Content: Grid View or Table View */}
      {loading ? (
        <Card style={{ borderRadius: 12 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : paginatedClasses.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <TeacherClassGrid classes={paginatedClasses} loading={loading} />
          ) : (
            <TeacherClassListTable classes={paginatedClasses} loading={loading} />
          )}

          {/* Pagination */}
          {filteredClasses.length > pageSize && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredClasses.length}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      ) : (
        <Card style={{ borderRadius: 12, padding: 40, textAlign: "center" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                {searchQuery || statusFilter !== "all"
                  ? "Không tìm thấy lớp học nào phù hợp với bộ lọc tìm kiếm."
                  : "Bạn chưa được phân công lớp học nào. Vui lòng liên hệ Admin!"}
              </Text>
            }
          />
        </Card>
      )}
    </div>
  );
}
