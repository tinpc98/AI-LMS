import React, { useEffect } from "react";
import { Table, Avatar, Tag, Spin, Alert, Row, Col, Statistic, Button } from "antd";
import { TrophyOutlined, StarOutlined, DownloadOutlined, RiseOutlined } from "@ant-design/icons";
import { useLearningAnalytics } from "../../../report/hooks/useLearningAnalytics";
import { useAnalytics } from "../../../report/hooks/useAnalytics";

interface TeacherAnalyticsTabProps {
  classId: string;
}

export const TeacherAnalyticsTab: React.FC<TeacherAnalyticsTabProps> = ({ classId }) => {
  const {
    classRanking,
    loading: rankingLoading,
    fetchClassRanking,
  } = useLearningAnalytics(classId);
  const {
    teacherDashboard,
    loading: dashLoading,
    fetchTeacherDashboard,
    downloadReport,
  } = useAnalytics(classId);

  useEffect(() => {
    fetchClassRanking({ limit: 100 });
    fetchTeacherDashboard();
  }, [fetchClassRanking, fetchTeacherDashboard]);

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

  if (rankingLoading || dashLoading) {
    return <Spin className="block mx-auto mt-10" />;
  }

  const { overview, lowProgressStudents } = teacherDashboard || {};

  return (
    <div className="space-y-6">
      {/* OVERVIEW DASHBOARD */}
      {overview && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
              <Statistic
                title="Tiến độ học (Trung bình)"
                value={overview.classAvgProgress}
                suffix="%"
                valueStyle={{ color: "var(--color-action-primary-bg)" }}
              />
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
              <Statistic
                title="Tỉ lệ điểm danh"
                value={overview.attendanceRate}
                suffix="%"
                valueStyle={{ color: "var(--color-success-base)" }}
              />
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
              <Statistic
                title="Điểm bài tập (Trung bình)"
                value={overview.assignmentAvgScore}
                valueStyle={{ color: "var(--color-secondary-icon)" }}
              />
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
              <Statistic
                title="Tổng số học sinh"
                value={overview.totalStudents}
                valueStyle={{ color: "var(--color-warning-base)" }}
              />
            </div>
          </Col>
        </Row>
      )}

      {/* RANKING & EXPORT */}
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <TrophyOutlined className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold m-0">Bảng xếp hạng lớp học</h2>
              <p className="text-sm text-gray-500 m-0">
                Đánh giá quá trình học tập tự động bằng AI
              </p>
            </div>
          </div>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadReport}
            className="bg-green-600 hover:bg-green-700"
          >
            Xuất báo cáo CSV
          </Button>
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

      {/* LOW PROGRESS ALERTS */}
      {lowProgressStudents && lowProgressStudents.length > 0 && (
        <div className="p-6 bg-red-50 rounded-xl shadow-sm border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <RiseOutlined className="text-red-500 text-xl rotate-180" />
            <h2 className="text-lg font-bold text-red-700 m-0">
              Học sinh cần chú ý (Tiến độ thấp)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowProgressStudents.map((student) => (
              <div
                key={student.studentId}
                className="bg-white p-3 rounded border border-red-200 flex justify-between items-center"
              >
                <span className="font-medium">{student.fullName}</span>
                <Tag color="red">{student.avgProgress}%</Tag>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
