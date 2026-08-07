import React from "react";
import { Modal, Button, Typography, Space, Tag, Card, Divider, Alert, Spin } from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import ExamResultCard from "./ExamResultCard";
import ExamQuestionReviewList from "./ExamQuestionReviewList";
import type { IExtendedExam } from "../../../../../types/studentExam";

const { Text, Title } = Typography;

interface ExamReviewModalProps {
  open: boolean;
  item: IExtendedExam | null;
  reviewData: any | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
}

const mapCheatType = (type: string) => {
  switch (type) {
    case "TAB_SWITCH":
      return "Rời khỏi màn hình bài thi";
    case "FULLSCREEN_EXIT":
      return "Thoát chế độ toàn màn hình";
    case "COPY_PASTE":
      return "Sao chép/Dán nội dung";
    case "MULTIPLE_FACES":
      return "Phát hiện nhiều khuôn mặt";
    default:
      return type;
  }
};

export const ExamReviewModal: React.FC<ExamReviewModalProps> = React.memo(
  ({ open, item, reviewData, loading, error, onClose }) => {
    if (!item) return null;

    const questionsList = reviewData?.answersDetail || [];
    const isSuspended = (reviewData?.cheatWarnings || 0) >= 5;

    // Phân tích cheat logs
    const cheatLogs = reviewData?.cheatLogs || [];
    const cheatSummary: Record<string, number> = {};
    cheatLogs.forEach((log: any) => {
      const mapped = mapCheatType(log.cheatType);
      cheatSummary[mapped] = (cheatSummary[mapped] || 0) + 1;
    });

    return (
      <Modal
        open={open}
        onCancel={onClose}
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "var(--color-text-title)" }}>
                Xem lại bài làm & Đáp án
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.title}
              </Text>
            </div>
          </Space>
        }
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Đóng
            </Button>
          </div>
        }
        width={850}
        centered
        destroyOnClose
        styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingRight: 8, paddingTop: 16 } }}
      >
        <div style={{ padding: "8px 0" }}>
          {isSuspended && (
            <Alert
              message="Bài thi bị đình chỉ"
              description="Sinh viên đã vi phạm quy chế thi từ 5 lần trở lên. Bài thi tự động bị thu và điểm số bị vô hiệu hóa."
              type="error"
              showIcon
              style={{ marginBottom: 20, borderRadius: 10 }}
            />
          )}

          {/* Result Card Summary */}
          {reviewData?.isHideAnswers ? (
            <Alert
              message="Chưa kết thúc thời gian làm bài"
              description="Trạng thái bài làm đã nộp. Hệ thống sẽ công bố đáp án và điểm sau khi hết thời gian làm bài của toàn lớp."
              type="info"
              showIcon
              style={{ marginBottom: 20, borderRadius: 10 }}
            />
          ) : (
            <ExamResultCard 
              attempt={item.attempt} 
              maxScore={item.maxScore || 10} 
              isSuspended={isSuspended} 
            />
          )}

          {/* Cheat Tracking Box */}
          {!reviewData?.isHideAnswers && (
            <Card
              size="small"
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: "var(--color-primary-base)" }} />
                  <Text strong>Giám sát bài thi</Text>
                </Space>
              }
              style={{ marginTop: 16, borderRadius: 12, border: "1px solid var(--color-border-default)" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {reviewData?.cheatWarnings > 0 ? (
                  <>
                    <Text>
                      Số lần vi phạm: <Text strong style={{ color: "var(--color-error-text)" }}>{reviewData.cheatWarnings}/5</Text>
                    </Text>
                    {Object.keys(cheatSummary).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text type="secondary">Chi tiết:</Text>
                        <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                          {Object.entries(cheatSummary).map(([key, count]) => (
                            <li key={key}>
                              <Text>{key} ({count} lần)</Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <Space>
                    <CheckCircleOutlined style={{ color: "var(--color-success-base)" }} />
                    <Text strong style={{ color: "var(--color-success-text)" }}>Không phát hiện vi phạm</Text>
                  </Space>
                )}
              </div>
            </Card>
          )}

          <Divider style={{ margin: "20px 0" }} />

          <Text
            strong
            style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 12 }}
          >
            <BookOutlined style={{ marginRight: 6 }} /> Danh sách câu hỏi & Đáp án chi tiết:
          </Text>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin tip="Đang tải chi tiết đáp án bài thi..." />
            </div>
          ) : error ? (
            <Alert
              message="Không thể tải kết quả bài thi"
              description={error}
              type="error"
              showIcon
              style={{ borderRadius: 10 }}
            />
          ) : reviewData?.isHideAnswers ? null : (
            <ExamQuestionReviewList questionsList={questionsList} />
          )}
        </div>
      </Modal>
    );
  }
);

ExamReviewModal.displayName = "ExamReviewModal";

export default ExamReviewModal;
