import React from "react";
import { Card, Descriptions, Tag, Typography, Space, Row, Col, List, Empty } from "antd";
import {
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LinkOutlined,
  PercentageOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface TeacherClassOverviewTabProps {
  classInfo: any;
}

export const TeacherClassOverviewTab: React.FC<TeacherClassOverviewTabProps> = React.memo(({ classInfo }) => {
  if (!classInfo) return null;

  const teacherName = typeof classInfo.teacherId === "object" ? classInfo.teacherId?.fullName : "Giảng viên";
  const teacherEmail = typeof classInfo.teacherId === "object" ? classInfo.teacherId?.email : "";
  const courseName = typeof classInfo.courseId === "object" ? classInfo.courseId?.courseName : "";
  const courseSubject = typeof classInfo.courseId === "object" ? classInfo.courseId?.subject : "";

  const scheduleDays = Array.isArray(classInfo.schedule?.days) ? classInfo.schedule.days.join(", ") : "Chưa xếp lịch";
  const startTime = classInfo.schedule?.startTime || "08:00";
  const endTime = classInfo.schedule?.endTime || "10:00";

  return (
    <Row gutter={[24, 24]}>
      {/* Cột trái: Thông tin tổng quan lớp học & Mô tả */}
      <Col xs={24} lg={16}>
        <Card title={<Title level={5} style={{ margin: 0 }}>📋 Thông tin chi tiết lớp học</Title>} style={{ borderRadius: 12, marginBottom: 24 }}>
          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="Tên lớp học" span={2}>
              <Text strong>{classInfo.className}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã lớp tham gia">
              <Tag color="cyan" style={{ fontFamily: "monospace", fontSize: 13 }}>
                {classInfo.joinCode || classInfo.classCode || "Chưa có"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color="green">{classInfo.status || "Đang hoạt động"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Khóa học">
              {courseName || "Chưa gán"}
            </Descriptions.Item>
            <Descriptions.Item label="Chủ đề / Môn học">
              {courseSubject || "Tổng hợp"}
            </Descriptions.Item>
            <Descriptions.Item label="Lịch học tuần" span={2}>
              <Space>
                <CalendarOutlined style={{ color: "#1890ff" }} />
                <span>{scheduleDays} ({startTime} - {endTime})</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Hình thức học">
              <Tag color="blue">{classInfo.learningMode || "Hybrid"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Sĩ số">
              {classInfo.students?.length || 0} / {classInfo.maxStudents || 30} học sinh
            </Descriptions.Item>
          </Descriptions>

          {classInfo.description && (
            <div style={{ marginTop: 20 }}>
              <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Mô tả lớp học:</Text>
              <Paragraph style={{ backgroundColor: "#f9f9f9", padding: 12, borderRadius: 8 }}>
                {classInfo.description}
              </Paragraph>
            </div>
          )}
        </Card>

        {/* Khung Tài liệu học tập (Resources) */}
        <Card title={<Title level={5} style={{ margin: 0 }}>📂 Tài liệu & Tài nguyên đính kèm</Title>} style={{ borderRadius: 12 }}>
          {Array.isArray(classInfo.resources) && classInfo.resources.length > 0 ? (
            <List
              dataSource={classInfo.resources}
              renderItem={(res: any) => (
                <List.Item
                  actions={[
                    <a href={res.url} target="_blank" rel="noreferrer" key="view">
                      <LinkOutlined /> Mở liên kết
                    </a>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />}
                    title={res.title || "Tài liệu học tập"}
                    description={res.description || res.url}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tài liệu đính kèm nào trong lớp học." />
          )}
        </Card>
      </Col>

      {/* Cột phải: Giảng viên phụ trách & Tỷ trọng điểm */}
      <Col xs={24} lg={8}>
        <Card title={<Title level={5} style={{ margin: 0 }}>👨‍🏫 Giảng viên phụ trách</Title>} style={{ borderRadius: 12, marginBottom: 24 }}>
          <Space size={14} align="center">
            <UserOutlined style={{ fontSize: 32, padding: 10, backgroundColor: "#e6f7ff", color: "#1890ff", borderRadius: 8 }} />
            <div>
              <Text strong style={{ fontSize: 15, display: "block" }}>{teacherName}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{teacherEmail}</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color="cyan">Giảng viên chính</Tag>
              </div>
            </div>
          </Space>
        </Card>

        {/* Khung Tỷ trọng điểm (Grading Weight) */}
        <Card title={<Title level={5} style={{ margin: 0 }}>📊 Tỷ trọng điểm số lớp</Title>} style={{ borderRadius: 12 }}>
          {classInfo.gradingWeight ? (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Chuyên cần / Điểm danh">
                {classInfo.gradingWeight.attendance ?? 10}%
              </Descriptions.Item>

              <Descriptions.Item label="Bài tập về nhà">
                {classInfo.gradingWeight.assignment ?? 20}%
              </Descriptions.Item>

              <Descriptions.Item label="Bài kiểm tra giữa kỳ">
                {classInfo.gradingWeight.midterm ?? 30}%
              </Descriptions.Item>

              <Descriptions.Item label="Thi cuối kỳ">
                {classInfo.gradingWeight.finalExam ?? 40}%
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Text type="secondary">Sử dụng tỷ trọng điểm tiêu chuẩn hệ thống.</Text>
          )}
        </Card>
      </Col>
    </Row>
  );
});

TeacherClassOverviewTab.displayName = "TeacherClassOverviewTab";
