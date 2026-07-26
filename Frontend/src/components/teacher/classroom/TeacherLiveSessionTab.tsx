import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Space,
  Typography,
  Popconfirm,
  Empty,
  Skeleton,
  Badge,
  Descriptions,
  Alert,
  Tooltip,
} from "antd";
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  StopOutlined,
  LinkOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import { useJitsiLiveSession } from "../../../hooks/useJitsiLiveSession";
import { liveApi } from "../../../api/liveApi";
import LiveRoomModal from "../../features/LiveRoomModal";
import { toast } from "../../../utils/toast";

const { Title, Text, Paragraph } = Typography;

interface TeacherLiveSessionTabProps {
  classId: string;
  className?: string;
  teacherName?: string;
}

export const TeacherLiveSessionTab: React.FC<TeacherLiveSessionTabProps> = React.memo(
  ({ classId, className = "Lớp học", teacherName = "Giảng viên" }) => {
    const {
      isLiveRoomOpen,
      setIsLiveRoomOpen,
      meetingRoomId,
      jwtToken,
      appId,
      isLiveLoading,
      handleStartLiveSession,
      handleJoinLiveClass,
      handleEndLiveSession,
    } = useJitsiLiveSession({ classId, isTeacher: true });

    const [activeSessionData, setActiveSessionData] = useState<any | null>(null);
    const [fetchingStatus, setFetchingStatus] = useState<boolean>(true);

    const checkActiveSession = useCallback(async () => {
      if (!classId) return;
      setFetchingStatus(true);
      try {
        const res = await liveApi.getActiveSession(classId);
        setActiveSessionData(res?.data?.data || null);
      } catch (err) {
        console.warn("[TeacherLiveSessionTab] Fetch error:", err);
        setActiveSessionData(null);
      } finally {
        setFetchingStatus(false);
      }
    }, [classId]);

    useEffect(() => {
      checkActiveSession();
    }, [checkActiveSession]);

    const isSessionLive = !!meetingRoomId || !!activeSessionData;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Header Banner & Quick Statistics */}
        <Card
          style={{
            borderRadius: 16,
            background: isSessionLive
              ? "linear-gradient(135deg, #cf1322 0%, #a8071a 100%)"
              : "linear-gradient(135deg, #002140 0%, #003a70 100%)",
            color: "#fff",
            boxShadow: isSessionLive
              ? "0 8px 24px rgba(207, 19, 34, 0.35)"
              : "0 8px 24px rgba(0, 33, 64, 0.25)",
            transition: "all 0.3s ease",
          }}
          styles={{ body: { padding: "24px 32px" } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <Space size={12} align="center">
                <VideoCameraOutlined style={{ fontSize: 28, color: "#fff" }} />
                <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                  Quản lý Phòng học Live: {className}
                </Title>
              </Space>
              <Text style={{ color: "rgba(255,255,255,0.85)", display: "block", marginTop: 4, fontSize: 13 }}>
                Khởi tạo phòng học trực tuyến Jitsi / Google Meet, giảng dạy trực tiếp và tương tác với học sinh.
              </Text>
            </div>

            <Button
              type="default"
              icon={<ReloadOutlined spin={fetchingStatus} />}
              onClick={checkActiveSession}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.4)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Làm mới trạng thái
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Trạng thái phòng</Text>}
                  value={isSessionLive ? "ĐANG LIVE" : "SẴN SÀNG"}
                  styles={{ content: { color: isSessionLive ? "#ffccc7" : "#b7eb8f", fontWeight: 700, fontSize: 18 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Phòng Jitsi Room ID</Text>}
                  value={meetingRoomId || activeSessionData?.meetingRoomId || "Chưa tạo"}
                  styles={{ content: { color: "#fff", fontWeight: 600, fontSize: 15, fontFamily: "monospace" } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Giảng viên chủ trì</Text>}
                  value={teacherName}
                  prefix={<UserOutlined style={{ color: "#ffe58f", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 600, fontSize: 16 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Nền tảng tích hợp</Text>}
                  value="Jitsi Meet 8x8"
                  styles={{ content: { color: "#fff", fontWeight: 600, fontSize: 16 } }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* 2. Active Session Main Action Banner */}
        <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 28 } }}>
          {fetchingStatus ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : isSessionLive ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <Space size={12} align="center">
                  <Badge status="processing" color="red" text={<Text strong style={{ color: "#cf1322", fontSize: 16 }}>🔴 BUỔI HỌC TRỰC TUYẾN ĐANG DIỄN RA</Text>} />
                  {activeSessionData?.sessionNumber && (
                    <Tag color="volcano">Buổi số #{activeSessionData.sessionNumber}</Tag>
                  )}
                </Space>

                <Tag color="cyan" style={{ fontSize: 13, fontFamily: "monospace" }}>
                  Room: {meetingRoomId || activeSessionData?.meetingRoomId}
                </Tag>
              </div>

              <Paragraph style={{ fontSize: 14, color: "#595959", margin: 0 }}>
                Buổi học trực tuyến của lớp <b>{className}</b> đã được bật. Học sinh đang có thể tham gia vào phòng học ngay lúc này.
              </Paragraph>

              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                <Button
                  type="primary"
                  danger
                  size="large"
                  icon={<PlayCircleOutlined />}
                  loading={isLiveLoading}
                  onClick={handleJoinLiveClass}
                  style={{ fontWeight: 700, borderRadius: 8, height: 44, paddingLeft: 24, paddingRight: 24 }}
                >
                  Tham gia phòng học ngay
                </Button>

                <Popconfirm
                  title="Kết thúc buổi học trực tuyến này?"
                  description="Hành động này sẽ ngắt kết nối và thông báo kết thúc cho toàn bộ học sinh."
                  onConfirm={async () => {
                    await handleEndLiveSession();
                    checkActiveSession();
                    toast.success("Đã kết thúc buổi học trực tuyến.");
                  }}
                  okText="Kết thúc"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="default"
                    size="large"
                    icon={<StopOutlined />}
                    style={{ borderRadius: 8, height: 44 }}
                  >
                    Kết thúc buổi học
                  </Button>
                </Popconfirm>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <VideoCameraOutlined style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }} />
              <Title level={4} style={{ marginBottom: 8 }}>
                Bắt đầu buổi học trực tuyến mới cho lớp {className}
              </Title>
              <Paragraph type="secondary" style={{ maxWidth: 600, margin: "0 auto 24px", fontSize: 14 }}>
                Bấm vào nút bên dưới để tự động tạo phòng học trực tuyến Jitsi Meet. Hệ thống sẽ phát thông báo thời gian thực tới tất cả học sinh trong lớp.
              </Paragraph>

              <Button
                type="primary"
                size="large"
                icon={<VideoCameraOutlined />}
                loading={isLiveLoading}
                onClick={async () => {
                  await handleStartLiveSession();
                  checkActiveSession();
                }}
                style={{ fontWeight: 700, borderRadius: 8, height: 48, paddingLeft: 32, paddingRight: 32, fontSize: 16 }}
              >
                Bắt đầu phòng LIVE ngay
              </Button>
            </div>
          )}
        </Card>

        {/* 3. Session Info & Guidelines Descriptions */}
        <Card title="📌 Thông tin & Hướng dẫn phòng học Live" style={{ borderRadius: 12 }}>
          <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
            <Descriptions.Item label="Lớp học">{className}</Descriptions.Item>
            <Descriptions.Item label="Phân quyền">{teacherName} (Giáo viên chủ trì - Host)</Descriptions.Item>
            <Descriptions.Item label="Công nghệ Video Call">Jitsi Meet 8x8 Cloud / WebRTC Full HD</Descriptions.Item>
            <Descriptions.Item label="Tính năng hỗ trợ">Chia sẻ màn hình, Bật/Tắt Micro & Cam, Chat trực tiếp, Giơ tay phát biểu</Descriptions.Item>
            <Descriptions.Item label="Quyền hạn Giáo viên" span={2}>
              • Giáo viên có quyền bật phòng thi/học bất kỳ lúc nào.<br />
              • Tự động ghi nhận thông báo thời gian thực qua WebSockets tới học sinh trong lớp.<br />
              • Được phép kết thúc buổi học và ngắt kết nối phòng học của lớp.
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Jitsi Live Room Modal */}
        <LiveRoomModal
          isOpen={isLiveRoomOpen}
          onClose={() => {
            setIsLiveRoomOpen(false);
            checkActiveSession();
          }}
          meetingRoomId={meetingRoomId}
          jwtToken={jwtToken}
          appId={appId}
        />
      </div>
    );
  }
);

TeacherLiveSessionTab.displayName = "TeacherLiveSessionTab";
