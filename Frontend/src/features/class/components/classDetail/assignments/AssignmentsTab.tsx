import React from "react";
import { Typography, Card, Button, Space, Tag, List } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { IAssignment } from "../../../../../interface/assignmentInterface";

const { Title, Text, Paragraph } = Typography;

interface AssignmentsTabProps {
  assignments?: IAssignment[];
  loading?: boolean;
}

// TÍNH NĂNG MỚI: mirror cách ExamCard hiển thị thời lượng/hạn — Assignment trước đây không có
// deadline nào để hiển thị.
const isClosed = (item: IAssignment) => Boolean(item.endAt && new Date(item.endAt) < new Date());

const AssignmentsTab: React.FC<AssignmentsTabProps> = React.memo(
  ({ assignments = [], loading = false }) => {
    const navigate = useNavigate();

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ marginBottom: 24 }}>
          <Title
            level={4}
            style={{ margin: "0 0 4px 0", fontWeight: 700, color: "var(--color-text-title)" }}
          >
            📝 Bài tập của tôi
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Theo dõi danh sách bài tập, trạng thái và làm bài trực tuyến.
          </Text>
        </div>

        <List
          loading={loading}
          grid={{ gutter: 16, column: 1 }}
          dataSource={assignments}
          renderItem={(item) => (
            <List.Item>
              <Card size="small" style={{ borderRadius: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {item.title}
                    </Title>
                    <Space style={{ marginTop: 8 }} wrap>
                      <Tag color={item.status === "PUBLISHED" ? "success" : "default"}>
                        {item.status}
                      </Tag>
                      {isClosed(item) && <Tag color="error">Đã hết hạn</Tag>}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.questions?.length || 0} câu hỏi
                      </Text>
                      <Tag icon={<ClockCircleOutlined />}>{item.duration || 30} phút</Tag>
                    </Space>
                    {item.endAt && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Hạn nộp: {new Date(item.endAt).toLocaleString("vi-VN")}
                        </Text>
                      </div>
                    )}
                    {item.description && (
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                        style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}
                      >
                        {item.description}
                      </Paragraph>
                    )}
                  </div>
                  <div>
                    {item.status === "PUBLISHED" && !isClosed(item) && (
                      <Button
                        type="primary"
                        onClick={() => navigate(`/studentassignment/${item._id}`)}
                      >
                        Làm bài ngay
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    );
  }
);

export default AssignmentsTab;
