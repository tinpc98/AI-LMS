import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Empty,
  Skeleton,
  Avatar,
  Tooltip,
  Alert,
  Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  TrophyOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  UserOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import gradeApi from "../../../api/gradeApi";
import type { IGrade } from "../../../api/gradeApi";
import { toast } from "../../../utils/toast";
import { GradeDetailDrawer } from "./GradeDetailDrawer";

const { Title, Text, Paragraph } = Typography;

interface TeacherGradebookTabProps {
  classId: string;
  className?: string;
  teacherName?: string;
  students?: any[];
  onRefresh?: () => void;
  loading?: boolean;
}

export const TeacherGradebookTab: React.FC<TeacherGradebookTabProps> = React.memo(
  ({ classId, className = "Lớp học", teacherName = "Giảng viên", students = [] }) => {
    const [grades, setGrades] = useState<IGrade[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Toolbar states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterGrade, setFilterGrade] = useState("all");
    const [sortBy, setSortBy] = useState("avg-desc");

    // Drawer state
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Fetch grades for class
    const fetchGrades = useCallback(async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      try {
        const list = await gradeApi.getGradesByClass(classId);
        setGrades(list || []);
      } catch (err: any) {
        console.error("[TeacherGradebookTab] Fetch error:", err);
        setError(err.message || "Không thể tải bảng điểm của lớp!");
      } finally {
        setLoading(false);
      }
    }, [classId]);

    useEffect(() => {
      fetchGrades();
    }, [fetchGrades]);

    // Map grades by student ID for rendering
    const studentGradeRows = useMemo(() => {
      return students.map((stu) => {
        const sObj = typeof stu.studentId === "object" && stu.studentId !== null ? stu.studentId : stu;
        const sId = (sObj._id || stu._id || "").toString();
        const name = sObj.fullName || stu.fullName || "Học sinh";
        const email = sObj.email || stu.email || "";
        const avatar = sObj.avatar || stu.avatar;

        const studentGrades = grades.filter(
          (g) => (typeof g.studentId === "object" ? g.studentId?._id : g.studentId)?.toString() === sId
        );

        const getCategoryScore = (cat: string) => {
          const found = studentGrades.find((g) => g.category === cat);
          return found ? found.score : null;
        };

        const attendanceScore = getCategoryScore("Attendance");
        const assignmentScore = getCategoryScore("Assignment");
        const midtermScore = getCategoryScore("Midterm");
        const finalScore = getCategoryScore("Final");

        // Compute Weighted Average GPA (10% Attendance, 20% Assignment, 30% Midterm, 40% Final)
        let totalScore = 0;
        let totalWeight = 0;
        if (attendanceScore !== null) { totalScore += attendanceScore * 0.1; totalWeight += 0.1; }
        if (assignmentScore !== null) { totalScore += assignmentScore * 0.2; totalWeight += 0.2; }
        if (midtermScore !== null) { totalScore += midtermScore * 0.3; totalWeight += 0.3; }
        if (finalScore !== null) { totalScore += finalScore * 0.4; totalWeight += 0.4; }

        const avgGPA = totalWeight > 0 ? parseFloat((totalScore / totalWeight).toFixed(2)) : null;

        // Letter Grade conversion
        let letterGrade = "-";
        if (avgGPA !== null) {
          if (avgGPA >= 9.0) letterGrade = "A+";
          else if (avgGPA >= 8.5) letterGrade = "A";
          else if (avgGPA >= 8.0) letterGrade = "B+";
          else if (avgGPA >= 7.0) letterGrade = "B";
          else if (avgGPA >= 6.5) letterGrade = "C+";
          else if (avgGPA >= 5.5) letterGrade = "C";
          else if (avgGPA >= 5.0) letterGrade = "D+";
          else if (avgGPA >= 4.0) letterGrade = "D";
          else letterGrade = "F";
        }

        return {
          student: stu,
          studentObj: sObj,
          name,
          email,
          avatar,
          studentIdStr: sId,
          attendanceScore,
          assignmentScore,
          midtermScore,
          finalScore,
          avgGPA,
          letterGrade,
          isPassed: avgGPA !== null ? avgGPA >= 5.0 : null,
        };
      });
    }, [students, grades]);

    // Statistics calculation
    const stats = useMemo(() => {
      const gpas = studentGradeRows.map((r) => r.avgGPA).filter((g): g is number => g !== null);
      const totalStudents = students.length;
      const passedCount = studentGradeRows.filter((r) => r.isPassed === true).length;
      const failedCount = studentGradeRows.filter((r) => r.isPassed === false).length;

      const maxScore = gpas.length > 0 ? Math.max(...gpas) : 0;
      const minScore = gpas.length > 0 ? Math.min(...gpas) : 0;
      const avgClassScore = gpas.length > 0 ? parseFloat((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2)) : 0;
      const passRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;

      return { totalStudents, passedCount, failedCount, maxScore, minScore, avgClassScore, passRate };
    }, [studentGradeRows, students.length]);

    // Filter & Sort table rows
    const filteredRows = useMemo(() => {
      let result = [...studentGradeRows];

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter((r) => {
          const name = (r.student?.fullName || "").toLowerCase();
          const email = (r.student?.email || "").toLowerCase();
          const code = (r.studentIdStr || "").toLowerCase();
          return name.includes(q) || email.includes(q) || code.includes(q);
        });
      }

      // Filter
      if (filterGrade === "pass") {
        result = result.filter((r) => r.isPassed === true);
      } else if (filterGrade === "fail") {
        result = result.filter((r) => r.isPassed === false);
      } else if (filterGrade === "high") {
        result = result.filter((r) => r.avgGPA !== null && r.avgGPA >= 8.0);
      }

      // Sort
      result.sort((a, b) => {
        if (sortBy === "avg-asc") return (a.avgGPA ?? 0) - (b.avgGPA ?? 0);
        if (sortBy === "name-asc") return (a.student?.fullName || "").localeCompare(b.student?.fullName || "");
        // Default: avg-desc
        return (b.avgGPA ?? 0) - (a.avgGPA ?? 0);
      });

      return result;
    }, [studentGradeRows, searchQuery, filterGrade, sortBy]);

    // Color code badge for GPA
    const getGPATag = (gpa: number | null) => {
      if (gpa === null) return <Tag color="default">N/A</Tag>;
      if (gpa >= 9.0) return <Tag color="success" style={{ fontWeight: 700, fontSize: 14 }}>🟢 {gpa} (A+)</Tag>;
      if (gpa >= 8.0) return <Tag color="processing" style={{ fontWeight: 700, fontSize: 14 }}>🔵 {gpa} (Giỏi)</Tag>;
      if (gpa >= 6.5) return <Tag color="warning" style={{ fontWeight: 700, fontSize: 14 }}>🟠 {gpa} (Khá)</Tag>;
      return <Tag color="error" style={{ fontWeight: 700, fontSize: 14 }}>🔴 {gpa} (Trung bình/Cần cố gắng)</Tag>;
    };

    const columns: ColumnsType<any> = [
      {
        title: "#",
        key: "index",
        width: 50,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Học sinh",
        key: "studentInfo",
        render: (_, record) => {
          const code = record.studentIdStr ? record.studentIdStr.slice(-6).toUpperCase() : "N/A";
          return (
            <Space size={12}>
              <Avatar
                src={record.avatar || undefined}
                icon={!record.avatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "#1890ff" }}
              />
              <div>
                <Text strong style={{ fontSize: 14, display: "block" }}>
                  {record.name}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "monospace", color: "#8c8c8c" }}>
                  STU-{code}
                </Text>
              </div>
            </Space>
          );
        },
      },
      {
        title: "Điểm danh",
        dataIndex: "attendanceScore",
        key: "attendanceScore",
        width: 110,
        render: (score) => (score !== null ? <Text strong>{score}</Text> : <Text type="secondary">-</Text>),
      },
      {
        title: "Bài tập",
        dataIndex: "assignmentScore",
        key: "assignmentScore",
        width: 110,
        render: (score) => (score !== null ? <Text strong>{score}</Text> : <Text type="secondary">-</Text>),
      },
      {
        title: "Giữa kỳ",
        dataIndex: "midtermScore",
        key: "midtermScore",
        width: 110,
        render: (score) => (score !== null ? <Text strong>{score}</Text> : <Text type="secondary">-</Text>),
      },
      {
        title: "Cuối kỳ",
        dataIndex: "finalScore",
        key: "finalScore",
        width: 110,
        render: (score) => (score !== null ? <Text strong>{score}</Text> : <Text type="secondary">-</Text>),
      },
      {
        title: "Điểm TB Môn",
        dataIndex: "avgGPA",
        key: "avgGPA",
        width: 160,
        render: (gpa) => getGPATag(gpa),
      },
      {
        title: "Điểm chữ",
        dataIndex: "letterGrade",
        key: "letterGrade",
        width: 100,
        render: (letter) => <Tag color="blue" style={{ fontWeight: 700 }}>{letter}</Tag>,
      },
      {
        title: "Trạng thái",
        key: "status",
        width: 120,
        render: (_, record) => {
          if (record.isPassed === null) return <Tag color="default">Chưa xếp loại</Tag>;
          return record.isPassed ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>ĐẠT</Tag>
          ) : (
            <Tag color="error" icon={<CloseCircleOutlined />}>CHƯA ĐẠT</Tag>
          );
        },
      },
      {
        title: "Thao tác",
        key: "action",
        width: 130,
        align: "right",
        render: (_, record) => (
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedStudent(record.student);
              setIsDrawerOpen(true);
            }}
            style={{ borderRadius: 6 }}
          >
            Chấm / Sửa
          </Button>
        ),
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Header Banner & Quick Statistics */}
        <Card
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #002140 0%, #003a70 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(0, 33, 64, 0.25)",
          }}
          styles={{ body: { padding: "24px 32px" } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <Space size={12} align="center">
                <TrophyOutlined style={{ fontSize: 28, color: "#fff" }} />
                <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                  Bảng điểm Tổng hợp Lớp: {className}
                </Title>
              </Space>
              <Text style={{ color: "rgba(255,255,255,0.85)", display: "block", marginTop: 4, fontSize: 13 }}>
                Tổng hợp kết quả học tập (Điểm danh, Bài tập, Giữa kỳ, Cuối kỳ), điểm trung bình GPA và điểm chữ của sinh viên.
              </Text>
            </div>

            <Button
              type="default"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchGrades}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.4)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Làm mới
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Điểm TB Lớp</Text>}
                  value={stats.avgClassScore}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🏆 Điểm cao nhất</Text>}
                  value={stats.maxScore}
                  styles={{ content: { color: "#b7eb8f", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>📉 Điểm thấp nhất</Text>}
                  value={stats.minScore}
                  styles={{ content: { color: "#ffccc7", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, display: "block", marginBottom: 4 }}>
                  Tỷ lệ Đạt môn: {stats.passRate}% ({stats.passedCount}/{stats.totalStudents})
                </Text>
                <Progress percent={stats.passRate} strokeColor="#52c41a" showInfo={false} size="small" />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🔴 Tỷ lệ Chưa đạt</Text>}
                  value={stats.failedCount}
                  suffix={`/ ${stats.totalStudents} sinh viên`}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 18 } }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Lỗi nạp bảng điểm"
            description={error}
            type="error"
            showIcon
            action={<Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={fetchGrades}>Thử lại</Button>}
            style={{ borderRadius: 8 }}
          />
        )}

        {/* 2. Main Content: Toolbar & Table */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <Space size={12} wrap>
                <Input
                  placeholder="Tìm học sinh theo tên/email/mã..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 250, borderRadius: 8 }}
                  allowClear
                />

                <Select
                  value={filterGrade}
                  onChange={(val) => setFilterGrade(val)}
                  style={{ width: 160 }}
                  suffixIcon={<FilterOutlined />}
                  options={[
                    { value: "all", label: "Tất cả xếp loại" },
                    { value: "pass", label: "🟢 Học sinh ĐẠT" },
                    { value: "fail", label: "🔴 CHƯA ĐẠT" },
                    { value: "high", label: "🔵 Học lực Giỏi (>=8.0)" },
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  style={{ width: 160 }}
                  options={[
                    { value: "avg-desc", label: "Điểm TB Cao -> Thấp" },
                    { value: "avg-asc", label: "Điểm TB Thấp -> Cao" },
                    { value: "name-asc", label: "Tên A -> Z" },
                  ]}
                />
              </Space>

              <Space size={8}>
                <Tooltip title="Chức năng Xuất Excel chưa được Backend hỗ trợ API">
                  <Button type="default" disabled icon={<FileExcelOutlined style={{ color: "#52c41a" }} />}>
                    Export Excel
                  </Button>
                </Tooltip>

                <Tooltip title="Chức năng Xuất PDF chưa được Backend hỗ trợ API">
                  <Button type="default" disabled icon={<FilePdfOutlined style={{ color: "#ff4d4f" }} />}>
                    Export PDF
                  </Button>
                </Tooltip>
              </Space>
            </div>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
        >
          {loading ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : filteredRows.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredRows}
              rowKey={(record, index) => record.studentIdStr || `row-${index}`}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary">
                    {searchQuery || filterGrade !== "all"
                      ? "Không tìm thấy học sinh nào phù hợp bộ lọc."
                      : "Chưa có dữ liệu học sinh trong lớp."}
                  </Text>
                }
              />
            </div>
          )}
        </Card>

        {/* 3. Grade Detail Drawer */}
        <GradeDetailDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          student={selectedStudent}
          classId={classId}
          existingGrades={grades}
          onSaved={fetchGrades}
        />
      </div>
    );
  }
);

TeacherGradebookTab.displayName = "TeacherGradebookTab";
