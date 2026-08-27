import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Row, Col, Statistic, Skeleton } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  ApartmentOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { contributionApi } from "../../../api/contributionApi";
import { unwrapOrNull } from "../../../api/unwrap";

const CONTRIBUTION_SUMMARY_QUERY_KEY = ["teacher-attendance", "contribution-summary"];

// Trả lời câu hỏi cốt lõi "giá trị cho đi của tôi là bao nhiêu" (xem tài liệu ý tưởng
// EduSpace, mục 6/9) — trước đây không nơi nào trong hệ thống hiển thị số này, dù dữ liệu
// nguồn (điểm danh giáo viên đã xác nhận) đã đủ để tính từ khi tính năng điểm danh ra đời.
export const ContributionSummaryCard: React.FC = () => {
  const { data: summary, isLoading: loading } = useQuery({
    queryKey: CONTRIBUTION_SUMMARY_QUERY_KEY,
    queryFn: async () => unwrapOrNull((await contributionApi.getMy()).data),
  });

  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-100 shadow-sm mb-4" variant="borderless">
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card
      title="Đóng góp của bạn (buổi dạy đã xác nhận)"
      className="rounded-2xl border border-gray-100 shadow-sm mb-4"
      variant="borderless"
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Tổng giờ dạy"
            value={summary.totalHours}
            suffix="giờ"
            prefix={<ClockCircleOutlined className="text-indigo-500 mr-1" />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Số buổi đã dạy"
            value={summary.totalSessions}
            prefix={<CalendarOutlined className="text-emerald-500 mr-1" />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Số lớp"
            value={summary.totalClasses}
            prefix={<ApartmentOutlined className="text-amber-500 mr-1" />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Số học viên"
            value={summary.totalStudents}
            prefix={<TeamOutlined className="text-purple-500 mr-1" />}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default ContributionSummaryCard;
