import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Progress, Statistic, Row, Col, Alert, Spin } from "antd";
import { CheckCircleOutlined, TrophyOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { performanceApi, type IStudentPerformance, type IWeakness } from "../../../api/performanceApi";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const StudentReport: React.FC = () => {
  const [performances, setPerformances] = useState<IStudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await performanceApi.getMyPerformance();
        if (res.success && res.data) {
          setPerformances(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load performance data");
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  const totalQuestions = performances.reduce((acc, p) => acc + p.totalQuestions, 0);
  const totalCorrect = performances.reduce((acc, p) => acc + p.correctAnswers, 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  const getMasteryColor = (level: string) => {
    switch (level) {
      case "MASTERED": return "success";
      case "PROFICIENT": return "processing";
      case "DEVELOPING": return "warning";
      default: return "default";
    }
  };

  const columns = [
    {
      title: "Chủ đề (Topic)",
      dataIndex: "topicId",
      key: "topic",
      render: (topic: any) => <span className="font-medium text-gray-800">{topic?.name || "N/A"}</span>,
    },
    {
      title: "Đã trả lời",
      dataIndex: "answeredQuestions",
      key: "answered",
      render: (val: number, record: IStudentPerformance) => `${val} / ${record.totalQuestions}`,
    },
    {
      title: "Số câu đúng",
      dataIndex: "correctAnswers",
      key: "correct",
      render: (val: number) => <Tag color="success">{val} đúng</Tag>,
    },
    {
      title: "Độ chính xác",
      dataIndex: "accuracy",
      key: "accuracy",
      render: (accuracy: number) => (
        <Progress
          percent={accuracy}
          size="small"
          status={accuracy >= 85 ? "success" : accuracy >= 50 ? "active" : "exception"}
        />
      ),
    },
    {
      title: "Mức độ thông thạo",
      dataIndex: "masteryLevel",
      key: "mastery",
      render: (level: string) => <Tag color={getMasteryColor(level)}>{level}</Tag>,
    },
    {
      title: "Cập nhật lần cuối",
      dataIndex: "lastAttemptAt",
      key: "lastAttemptAt",
      render: (date: string) => date ? new Date(date).toLocaleString("vi-VN") : "Chưa có",
    },
  ];

  if (loading) {
    return <div className="p-10 flex justify-center"><Spin size="large" /></div>;
  }

  if (error) {
    return <Alert type="error" message="Lỗi" description={error} showIcon />;
  }

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Câu Đã Làm"
              value={totalQuestions}
              prefix={<CheckCircleOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Câu Đúng"
              value={totalCorrect}
              prefix={<TrophyOutlined className="text-green-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Độ Chính Xác Tổng Thể"
              value={overallAccuracy}
              precision={2}
              suffix="%"
              prefix={<CheckCircleOutlined className="text-amber-500 mr-2" />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Biểu Đồ Độ Chính Xác Theo Chủ Đề"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <div className="h-72">
          {performances.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performances.map(p => ({
                  name: p.topicId?.name || "Unknown",
                  accuracy: p.accuracy
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip cursor={{ fill: "#f3f4f6" }} />
                <Bar dataKey="accuracy" name="Độ chính xác (%)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Chưa có dữ liệu học tập</div>
          )}
        </div>
      </Card>

      <Card
        title="Báo Cáo Hiệu Suất Học Tập (Theo Chủ Đề)"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <Table 
          columns={columns} 
          dataSource={performances} 
          rowKey="_id" 
          pagination={false} 
        />
      </Card>
    </div>
  );
};
