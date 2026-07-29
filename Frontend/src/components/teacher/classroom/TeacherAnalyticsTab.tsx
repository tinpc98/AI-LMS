import React, { useEffect } from "react";
import { Table, Avatar, Tag, Spin, Alert } from "antd";
import { TrophyOutlined, StarOutlined } from "@ant-design/icons";
import { useLearningAnalytics } from "../../../hooks/useLearningAnalytics";

interface TeacherAnalyticsTabProps {
  classId: string;
}

export const TeacherAnalyticsTab: React.FC<TeacherAnalyticsTabProps> = ({ classId }) => {
  const { classRanking, loading, fetchClassRanking } = useLearningAnalytics(classId);

  useEffect(() => {
    fetchClassRanking({ limit: 100 });
  }, [fetchClassRanking]);

  const columns = [
    {
      title: "Hạng",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      render: (rank: number) => {
        if (rank === 1) return <StarOutlined className="text-yellow-500 text-xl" />;
        if (rank === 2) return <StarOutlined className="text-gray-400 text-xl" />;
        if (rank === 3) return <StarOutlined className="text-orange-400 text-xl" />;
        return <span className="font-semibold text-gray-500">#{rank}</span>;
      },
    },
    {
      title: "Học sinh",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar}>{text[0]}</Avatar>
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "Tiến độ (XP)",
      dataIndex: "lessonXP",
      key: "lessonXP",
      render: (val: number) => <Tag color="blue">{val} XP</Tag>,
    },
    {
      title: "Chuyên cần (XP)",
      dataIndex: "attendanceXP",
      key: "attendanceXP",
      render: (val: number) => <Tag color="green">{val} XP</Tag>,
    },
    {
      title: "Bài tập/Thi (XP)",
      dataIndex: "gradeXP",
      key: "gradeXP",
      render: (val: number) => <Tag color="purple">{val} XP</Tag>,
    },
    {
      title: "Tổng điểm",
      dataIndex: "totalXP",
      key: "totalXP",
      render: (val: number) => <span className="font-bold text-red-600">{val} XP</span>,
    },
  ];

  if (loading) {
    return <Spin className="block mx-auto mt-10" />;
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
          <TrophyOutlined className="text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-bold m-0">Bảng xếp hạng lớp học</h2>
          <p className="text-sm text-gray-500 m-0">Đánh giá quá trình học tập tự động bằng AI</p>
        </div>
      </div>

      {classRanking?.items && classRanking.items.length > 0 ? (
        <Table
          dataSource={classRanking.items}
          columns={columns}
          rowKey="studentId"
          pagination={{ pageSize: 10 }}
        />
      ) : (
        <Alert message="Chưa có dữ liệu xếp hạng trong lớp học này." type="info" showIcon />
      )}
    </div>
  );
};
