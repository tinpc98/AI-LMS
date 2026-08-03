import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Badge,
  Button,
  Input,
  Typography,
  Space,
  Pagination,
} from "antd";
import { BookOutlined, TeamOutlined, SearchOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { EmptyState } from "../../../shared/components/EmptyState";
import { tokens } from "../../../shared/theme/tokens";

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
      return <StatusBadge status={status || "Hoạt động"} />;
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
              <BookOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 20 }} />
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                Lớp học được phân công
              </Title>
              <Badge
                count={classes.length}
                overflowCount={99}
                style={{ backgroundColor: "var(--color-action-primary-bg)" }}
              />
            </Space>

            <Input
              placeholder="Tìm kiếm theo tên hoặc mã lớp..."
              prefix={<SearchOutlined style={{ color: tokens.color.text.description }} />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ flex: 1, minWidth: 200, maxWidth: 320, borderRadius: tokens.radius.md }}
              allowClear
            />
          </div>
        }
        style={{
          borderRadius: tokens.radius.lg,
          marginBottom: tokens.space[5],
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
        styles={{ body: { padding: tokens.space[5] } }}
      >
        {paginatedClasses.length > 0 ? (
          <>
            <Row gutter={[tokens.space[4], tokens.space[4]]}>
              {paginatedClasses.map((cls) => {
                const studentCount =
                  cls.currentStudents ?? (Array.isArray(cls.students) ? cls.students.length : 0);
                const max = cls.maxStudents || 30;
                const courseName = typeof cls.courseId === "object" ? cls.courseId?.courseName : "";

                return (
                  <Col xs={24} sm={24} md={12} lg={8} xl={6} key={cls._id}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border.default}`,
                        transition: "var(--transition-fast)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      styles={{
                        body: {
                          padding: tokens.space[4],
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
                            gap: 8,
                          }}
                        >
                          <Title
                            level={5}
                            style={{ margin: 0, fontSize: 16, fontWeight: 700, wordBreak: "break-word" }}
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
                        style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${tokens.color.border.divider}` }}
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
                            <TeamOutlined style={{ color: tokens.color.semantic.success.base }} />
                            <Text style={{ fontSize: 13, color: tokens.color.text.body }}>
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
                          style={{ borderRadius: tokens.radius.md, fontWeight: 600, minHeight: 44 }}
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
          <EmptyState
            description={
              searchQuery
                ? "Không tìm thấy lớp học phù hợp với từ khóa!"
                : "Bạn chưa được phân công quản lý lớp học nào."
            }
          />
        )}
      </Card>
    );
  }
);

TeacherClassroomsGrid.displayName = "TeacherClassroomsGrid";
