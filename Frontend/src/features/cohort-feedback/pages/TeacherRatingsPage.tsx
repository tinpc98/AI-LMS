import React from "react";
import { Card, Col, Row, Statistic, Typography, Empty, Skeleton, Alert } from "antd";
import { StarFilled, SmileOutlined, TeamOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { cohortFeedbackApi } from "../../../api/cohortFeedbackApi";
import { unwrapOrNull } from "../../../api/unwrap";

const { Title, Paragraph } = Typography;

// Giáo viên xem điểm trung bình ẨN DANH của chính mình — EduSpace mechanism design Phần C.3.
// Backend chỉ trả về số liệu tổng hợp, không lộ danh sách học viên đã đánh giá.
export const TeacherRatingsPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["cohort-feedback", "my-average"],
    queryFn: async () => unwrapOrNull((await cohortFeedbackApi.getMyAverage()).data),
  });

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          <StarFilled className="mr-2 text-amber-400" />
          Đánh giá của tôi
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Điểm trung bình từ học viên sau khi lớp kết thúc. Danh sách người đánh giá được ẩn danh để
          bạn nhận phản hồi thẳng thắn nhất.
        </Paragraph>
      </div>

      {isError && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải dữ liệu đánh giá"
          description="Vui lòng thử tải lại trang."
        />
      )}

      <Card className="rounded-2xl border border-gray-100 shadow-sm max-w-3xl" variant="borderless">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : !data || data.count === 0 ? (
          <Empty description="Chưa có đánh giá nào — sẽ xuất hiện sau khi các lớp bạn phụ trách kết thúc." />
        ) : (
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={8}>
              <Statistic title="Số lượt đánh giá" value={data.count} prefix={<TeamOutlined />} />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Bài giảng rõ ràng"
                value={data.avgClarity ?? 0}
                precision={2}
                suffix="/ 5"
                prefix={<StarFilled style={{ color: "#faad14" }} />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Hỗ trợ hữu ích"
                value={data.avgHelpfulness ?? 0}
                precision={2}
                suffix="/ 5"
                prefix={<SmileOutlined style={{ color: "#52c41a" }} />}
              />
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
};

export default TeacherRatingsPage;
