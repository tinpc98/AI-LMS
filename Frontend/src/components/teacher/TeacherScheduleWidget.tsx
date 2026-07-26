import React, { useMemo } from "react";
import { Card, Timeline, Tag, Typography, Empty, Space, Button } from "antd";
import { ClockCircleOutlined, CalendarOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface ClassScheduleItem {
  _id: string;
  className: string;
  classCode?: string;
  classRoom?: string;
  schedule?: {
    days?: string[];
    startTime?: string;
    endTime?: string;
  };
}

interface TeacherScheduleWidgetProps {
  classes?: ClassScheduleItem[];
  loading?: boolean;
}

export const TeacherScheduleWidget: React.FC<TeacherScheduleWidgetProps> = React.memo(
  ({ classes = [], loading = false }) => {
    const navigate = useNavigate();

    const daysOfWeekEnglish = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayEnglish = daysOfWeekEnglish[new Date().getDay()];

    const todayClasses = useMemo(() => {
      return classes.filter((cls) => {
        const days = cls.schedule?.days || [];
        return days.includes(todayEnglish);
      });
    }, [classes, todayEnglish]);

    return (
      <Card
        loading={loading}
        title={
          <Space>
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Lịch dạy hôm nay
            </Title>
          </Space>
        }
        style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        bodyStyle={{ padding: 20 }}
      >
        {todayClasses.length > 0 ? (
          <Timeline
            mode="left"
            items={todayClasses.map((cls) => ({
              dot: <ClockCircleOutlined style={{ fontSize: 16, color: "#1890ff" }} />,
              color: "blue",
              children: (
                <div
                  style={{
                    backgroundColor: "#f0f5ff",
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid #adc6ff",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong style={{ fontSize: 15, color: "#1d39c4" }}>
                      {cls.className}
                    </Text>
                    {cls.classCode && <Tag color="blue">{cls.classCode}</Tag>}
                  </div>

                  <div style={{ marginTop: 6, display: "flex", gap: 16, fontSize: 13, color: "#595959" }}>
                    <Space size={4}>
                      <ClockCircleOutlined />
                      <span>
                        {cls.schedule?.startTime || "08:00"} - {cls.schedule?.endTime || "10:00"}
                      </span>
                    </Space>
                    {cls.classRoom && (
                      <Tag color="cyan" style={{ margin: 0 }}>
                        Phòng: {cls.classRoom}
                      </Tag>
                    )}
                  </div>

                  <Button
                    type="link"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate(`/teacher/classroom-detail/${cls._id}`)}
                    style={{ padding: 0, marginTop: 8, fontWeight: 600 }}
                  >
                    Vào lớp học
                  </Button>
                </div>
              ),
            }))}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                Không có buổi học nào xếp lịch vào hôm nay ({todayEnglish}).
              </Text>
            }
          />
        )}
      </Card>
    );
  }
);

TeacherScheduleWidget.displayName = "TeacherScheduleWidget";
