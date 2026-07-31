import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Badge,
  Button,
  Input,
  Empty,
  Typography,
  Space,
  Tooltip,
  Pagination,
} from "antd";
import {
  BookOutlined,
  TeamOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface ClassModel {
  _id: string;
  className: string;
  classCode?: string;
  courseId?:
    | {
        courseName?: string;
        subject?: string;
      }
    | string;
  currentStudents?: number;
  maxStudents?: number;
  students?: any[];
  status?: string;
  learningMode?: string;
}

interface TeacherClassroomsGridProps {
  classes?: ClassModel[];
  loading?: boolean;
}

export const TeacherClassroomsGrid: React.FC<TeacherClassroomsGridProps> = React.memo(
  ({ classes = [], loading = false }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const filteredClasses = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      return classes.filter((c) => {
        const nameMatch = c.className?.toLowerCase().includes(q);
        const codeMatch = c.classCode?.toLowerCase().includes(q);
        return nameMatch || codeMatch;
      });
    }, [classes, searchQuery]);

    const paginatedClasses = useMemo(() => {
      const startIndex = (currentPage - 1) * pageSize;
      return filteredClasses.slice(startIndex, startIndex + pageSize);
    }, [filteredClasses, currentPage, pageSize]);

    const getStatusTag = (status?: string) => {
      switch (status) {
        case "Ready":
        case "Active":
        case "Ongoing":
          return <Tag color="success">Đang hoạt động</Tag>;
        case "Draft":
        case "Upcoming":
          return <Tag color="processing">Sắp diễn ra</Tag>;
        case "Completed":
          return <Tag color="default">Đã kết thúc</Tag>;
        case "Cancelled":
          return <Tag color="error">Đã hủy</Tag>;
        default:
          return <Tag color="blue">{status || "Hoạt động"}</Tag>;
      }
    };

    return (
      <Card
        loading={loading}
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space>
              <BookOutlined style={{ color: "#1890ff", fontSize: 20 }} />
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Lớp học được phân công
              </Title>
              <Badge
                count={classes.length}
                overflowCount={99}
                style={{ backgroundColor: "#1890ff" }}
              />
            </Space>

            <Input
              placeholder="Tìm kiếm theo tên hoặc mã lớp..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 260, borderRadius: 8 }}
              allowClear
            />
          </div>
        }
        style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        styles={{ body: { padding: 20 } }}
      >
        {paginatedClasses.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              {paginatedClasses.map((cls) => {
                const studentCount =
                  cls.currentStudents ?? (Array.isArray(cls.students) ? cls.students.length : 0);
                const max = cls.maxStudents || 30;
                const courseName = typeof cls.courseId === "object" ? cls.courseId?.courseName : "";

                return (
                  <Col xs={24} sm={12} lg={8} key={cls._id}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 10,
                        border: "1px solid #f0f0f0",
                        transition: "all 0.2s ease",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      styles={{
                        body: {
                          padding: 16,
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        },
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 8,
                          }}
                        >
                          <Title
                            level={5}
                            style={{ margin: 0, fontSize: 16, fontWeight: 700 }}
                            ellipsis={{ rows: 2 }}
                          >
                            {cls.className}
                          </Title>
                          {getStatusTag(cls.status)}
                        </div>

                        {cls.classCode && (
                          <Tag
                            color="cyan"
                            style={{ marginBottom: 12, borderRadius: 4, fontWeight: 600 }}
                          >
                            {cls.classCode}
                          </Tag>
                        )}

                        {courseName && (
                          <Text
                            type="secondary"
                            style={{ display: "block", fontSize: 13, marginBottom: 12 }}
                            ellipsis
                          >
                            Khóa học: {courseName}
                          </Text>
                        )}
                      </div>

                      <div
                        style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f5f5f5" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <Space size={6}>
                            <TeamOutlined style={{ color: "#52c41a" }} />
                            <Text style={{ fontSize: 13, color: "#595959" }}>
                              Sĩ số: <strong>{studentCount}</strong> / {max}
                            </Text>
                          </Space>
                          {cls.learningMode && <Tag style={{ margin: 0 }}>{cls.learningMode}</Tag>}
                        </div>

                        <Button
                          type="primary"
                          block
                          icon={<ArrowRightOutlined />}
                          onClick={() => navigate(`/teacher/classroom-detail/${cls._id}`)}
                          style={{ borderRadius: 6, fontWeight: 600 }}
                        >
                          Vào quản lý lớp
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

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
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                {searchQuery
                  ? "Không tìm thấy lớp học phù hợp với từ khóa!"
                  : "Bạn chưa được phân công quản lý lớp học nào."}
              </Text>
            }
          />
        )}
      </Card>
    );
  }
);

TeacherClassroomsGrid.displayName = "TeacherClassroomsGrid";
