import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Typography, Alert, Spin, Button, message } from "antd";
import { RobotOutlined, SyncOutlined } from "@ant-design/icons";
import { performanceApi, type IAIRecommendation } from "../../../api/performanceApi";
import dayjs from "dayjs";

const { Title, Paragraph } = Typography;

export const AIAnalytics: React.FC = () => {
  const [recommendations, setRecommendations] = useState<IAIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courseId = "60b9b0b9e6b3f3b3b4b5b6b7";

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await performanceApi.getMyRecommendations();
      if (res.success && res.data) {
        setRecommendations(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load AI recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await performanceApi.generateMyRecommendation(courseId);
      message.success("Đã tạo đề xuất học tập mới!");
      fetchRecommendations();
    } catch (err: any) {
      message.error(err.message || "Không thể tạo đề xuất. Vui lòng thử lại sau.");
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    {
      title: "Chủ đề cần cải thiện",
      dataIndex: "recommendedTopics",
      key: "topics",
      render: (topics: Array<{ _id: string; name: string }>) => (
        <div className="flex flex-wrap gap-2">
          {topics.map(t => (
            <Tag color="geekblue" key={t._id}>{t.name}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Giải thích từ AI",
      dataIndex: "explanation",
      key: "explanation",
      render: (text: string) => <Paragraph className="mb-0 text-sm max-w-lg">{text}</Paragraph>,
    },
    {
      title: "Mức độ ưu tiên",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => {
        let color = "default";
        if (priority === "CRITICAL") color = "error";
        if (priority === "HIGH") color = "warning";
        if (priority === "MEDIUM") color = "processing";
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "generatedAt",
      key: "generatedAt",
      render: (date: string) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "N/A",
    },
  ];

  if (loading) {
    return <div className="p-10 flex justify-center"><Spin size="large" /></div>;
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message="Lỗi" description={error} showIcon />}
      
      <Card 
        className="rounded-xl border border-gray-100 shadow-sm bg-gradient-to-r from-indigo-50 to-blue-50"
      >
        <div className="flex justify-between items-center">
          <div>
            <Title level={4} className="mb-1 text-indigo-800">
              <RobotOutlined className="mr-2" />
              Gợi Ý Học Tập Thông Minh (AI)
            </Title>
            <Paragraph className="text-gray-600 mb-0">
              Hệ thống AI tự động phân tích điểm yếu của bạn và đưa ra lộ trình cải thiện cá nhân hóa.
            </Paragraph>
          </div>
          <Button 
            type="primary" 
            icon={<SyncOutlined spin={generating} />} 
            onClick={handleGenerate}
            loading={generating}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Tạo Đề Xuất Mới
          </Button>
        </div>
      </Card>

      <Card
        title="Lịch Sử Đề Xuất Học Tập"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <Table 
          columns={columns} 
          dataSource={recommendations} 
          rowKey="_id" 
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "Chưa có đề xuất học tập nào." }}
        />
      </Card>
    </div>
  );
};

export default AIAnalytics;
