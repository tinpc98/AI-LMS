import React from "react";
import { Card, Typography, Badge, Tag, Button, Space, Row, Col, Avatar } from "antd";
import { ClockCircleOutlined, UserOutlined, VideoCameraOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../common/EmptyState";

import { formatSchedule } from "../../modules/student/learning/utils/learningDashboard.utils";

const { Title, Text } = Typography;

export interface ITodayClassItem {
  id: string;
  className: string;
  courseName?: string;
  teacherName?: string;
  teacherAvatar?: string;
  timeSlot?: string;
  status: "LIVE" | "UPCOMING" | "ENDED"; // LIVE = Đang học, UPCOMING = Sắp diễn ra, ENDED = Đã kết thúc
  liveRoomUrl?: string;
}

interface StudentTodayClassesProps {
  classes: ITodayClassItem[];
}

export const StudentTodayClasses: React.FC<StudentTodayClassesProps> = React.memo(({ classes }) => {
  const navigate = useNavigate();

  return (
    <Card
      title={
        <Space align="center">
          <BookOutlined style={{ color: "#1890ff", fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Hôm nay học gì?</span>
        </Space>
      }
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: 20 } }}
    >
      {classes.length === 0 ? (
        <EmptyState
          description="Hôm nay bạn không có lịch học nào. Hãy tận dụng thời gian để ôn bài!"
          style={{ padding: "32px 16px", border: "none" }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {classes.map((cls) => {
            const isLive = cls.status === "LIVE";
            const isUpcoming = cls.status === "UPCOMING";

            return (
              <Col xs={24} sm={12} lg={12} key={cls.id}>
                <Card
                  bordered
                  style={{
                    borderRadius: 12,
                    borderColor: isLive ? "#ff4d4f" : "#f0f0f0",
                    boxShadow: isLive ? "0 4px 12px rgba(255, 77, 79, 0.15)" : "none",
                    transition: "all 0.2s",
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <Title level={5} style={{ margin: 0, fontSize: 15, fontWeight: 700 }} ellipsis>
                        {cls.className}
                      </Title>
                      {cls.courseName && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {cls.courseName}
                        </Text>
                      )}
                    </div>

                    {isLive ? (
                      <Badge count="LIVE" style={{ backgroundColor: "#ff4d4f" }}>
                        <Tag color="error" icon={<VideoCameraOutlined />} style={{ margin: 0, borderRadius: 12 }}>
                          Đang học
                        </Tag>
                      </Badge>
                    ) : isUpcoming ? (
                      <Tag color="processing" style={{ margin: 0, borderRadius: 12 }}>
                        Sắp diễn ra
                      </Tag>
                    ) : (
                      <Tag color="default" style={{ margin: 0, borderRadius: 12 }}>
                        Đã kết thúc
                      </Tag>
                    )}
                  </div>

                  <Space direction="vertical" size={8} style={{ width: "100%", marginBottom: 16 }}>
                    <Space size={8}>
                      <Avatar
                        size={24}
                        src={cls.teacherAvatar || undefined}
                        icon={!cls.teacherAvatar ? <UserOutlined /> : undefined}
                      />
                      <Text style={{ fontSize: 13, color: "#595959" }}>
                        {cls.teacherName || "Giảng viên môn học"}
                      </Text>
                    </Space>

                    <Space size={8}>
                      <ClockCircleOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatSchedule(cls.timeSlot)}
                      </Text>
                    </Space>
                  </Space>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {isLive ? (
                      <Button
                        type="primary"
                        danger
                        icon={<VideoCameraOutlined />}
                        onClick={() => navigate(`/classdetail/${cls.id}`)}
                        style={{ borderRadius: 8 }}
                      >
                        Vào lớp
                      </Button>
                    ) : (
                      <Button
                        type="default"
                        onClick={() => navigate(`/classdetail/${cls.id}`)}
                        style={{ borderRadius: 8 }}
                      >
                        Xem chi tiết
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Card>
  );
});

StudentTodayClasses.displayName = "StudentTodayClasses";

export default StudentTodayClasses;
