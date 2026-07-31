import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Skeleton,
  Badge,
  Descriptions,
  Alert,
} from "antd";
import {
  VideoCameraOutlined,
  PlayCircleOutlined,
  StopOutlined,
  UserOutlined,
  ReloadOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";

import useLiveSessionState from "../../../hooks/useLiveSessionState";
import useLiveSessionSocket from "../../../hooks/useLiveSessionSocket";
import LiveSessionErrorBoundary from "../../features/LiveSessionErrorBoundary";

const { Title, Text, Paragraph } = Typography;

interface TeacherLiveSessionTabProps {
  classId: string;
  className?: string;
  teacherName?: string;
}

export const TeacherLiveSessionTab: React.FC<TeacherLiveSessionTabProps> = React.memo(
  ({ classId, className = "Lớp học", teacherName = "Giảng viên" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeCount, setActiveCount] = React.useState<number>(0);

    // 1. Hooks V2 Modular
    const {
      activeSession,
      isLoadingActive,
      isCreating,
      isEnding,
      error: sessionStateError,
      fetchActiveSession,
      createSession,
      endSession,
    } = useLiveSessionState({ classId });

    const { isOnline, isSocketConnected } = useLiveSessionSocket({
      classId,
      isTeacher: true,
      onSessionStarted: () => void fetchActiveSession(),
      onSessionEnded: () => {
        void fetchActiveSession();
      },
      onParticipantsUpdated: (count) => setActiveCount(count),
    });

    useEffect(() => {
      if (classId) {
        void fetchActiveSession();
      }
    }, [classId, fetchActiveSession]);

    const isSessionLive = activeSession?.status === "Live";
    const currentRoomName = activeSession?.roomName || (activeSession as any)?.meetingRoomId || "";

    const handleStart = async () => {
      try {
        const newSession = await createSession();
        if (newSession && newSession.id) {
          navigate(`/teacher/live/${newSession.id}`, {
            state: { classId, returnUrl: location.pathname },
          });
        }
      } catch (err) {
        console.error("[TeacherLiveSessionTab] handleStart Error:", err);
      }
    };

    const handleJoin = async () => {
      const targetId = activeSession?.id || (activeSession as any)?._id;
      if (targetId) {
        navigate(`/teacher/live/${targetId}`, { state: { classId, returnUrl: location.pathname } });
      } else {
        await fetchActiveSession();
      }
    };

    const handleEnd = async () => {
      try {
        await endSession();
        await fetchActiveSession();
      } catch (err) {
        console.error("[TeacherLiveSessionTab] handleEnd Error:", err);
      }
    };

    const isActionLoading = isLoadingActive || isCreating || isEnding;

    return (
      <LiveSessionErrorBoundary onReset={fetchActiveSession}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Cảnh báo mất mạng (Network Status Banner) */}
          {!isOnline && (
            <Alert
              type="warning"
              showIcon
              icon={<DisconnectOutlined />}
              message="Mất kết nối mạng"
              description="Buổi học trực tuyến có thể bị gián đoạn. Vui lòng kiểm tra lại đường truyền Internet."
              style={{ borderRadius: 12 }}
              role="alert"
            />
          )}

          {/* Cảnh báo Socket gián đoạn */}
          {isOnline && !isSocketConnected && (
            <Alert
              type="info"
              showIcon
              icon={<WifiOutlined />}
              message="Kênh thời gian thực tạm gián đoạn"
              description="Trạng thái buổi học vẫn được cập nhật tự động qua REST API."
              style={{ borderRadius: 12 }}
            />
          )}

          {/* Alert Hiển thị Lỗi nếu có */}
          {sessionStateError && (
            <Alert
              type="error"
              showIcon
              message={sessionStateError.title || "Lỗi phiên học"}
              description={sessionStateError.message}
              style={{ borderRadius: 12 }}
              action={
                <Button
                  size="small"
                  type="primary"
                  danger
                  icon={<ReloadOutlined />}
                  onClick={() => void fetchActiveSession()}
                >
                  Thử lại
                </Button>
              }
            />
          )}

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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <Space size={12} align="center">
                  <VideoCameraOutlined style={{ fontSize: 28, color: "#fff" }} />
                  <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                    Quản lý Phòng học Live: {className}
                  </Title>
                </Space>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    display: "block",
                    marginTop: 4,
                    fontSize: 13,
                  }}
                >
                  Khởi tạo buổi học trực tuyến JaaS 8x8, giảng dạy trực tiếp và tương tác với học
                  sinh.
                </Text>
              </div>

              <Button
                type="default"
                icon={<ReloadOutlined spin={isLoadingActive} />}
                onClick={() => void fetchActiveSession()}
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
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <Statistic
                    title={
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                        Trạng thái phòng
                      </Text>
                    }
                    value={isSessionLive ? "ĐANG LIVE" : "SẴN SÀNG"}
                    styles={{
                      content: {
                        color: isSessionLive ? "#ffccc7" : "#b7eb8f",
                        fontWeight: 700,
                        fontSize: 18,
                      },
                    }}
                  />
                </div>
              </Col>

              <Col xs={12} sm={8} md={6}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <Statistic
                    title={
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                        Phòng JaaS Room Name
                      </Text>
                    }
                    value={currentRoomName || "Chưa tạo"}
                    styles={{
                      content: {
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 15,
                        fontFamily: "monospace",
                      },
                    }}
                  />
                </div>
              </Col>

              <Col xs={12} sm={8} md={6}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <Statistic
                    title={
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                        Giảng viên chủ trì
                      </Text>
                    }
                    value={teacherName}
                    prefix={<UserOutlined style={{ color: "#ffe58f", marginRight: 6 }} />}
                    styles={{ content: { color: "#fff", fontWeight: 600, fontSize: 16 } }}
                  />
                </div>
              </Col>

              <Col xs={12} sm={8} md={6}>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <Statistic
                    title={
                      <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                        Nền tảng tích hợp
                      </Text>
                    }
                    value="8x8 JaaS (RS256)"
                    styles={{ content: { color: "#fff", fontWeight: 600, fontSize: 16 } }}
                  />
                </div>
              </Col>
            </Row>
          </Card>

          {/* 2. Active Session Action Banner */}
          <Card style={{ borderRadius: 16 }} styles={{ body: { padding: 28 } }}>
            {isLoadingActive ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : isSessionLive ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <Space size={12} align="center">
                    <Badge
                      status="processing"
                      color="red"
                      text={
                        <Text strong style={{ color: "#cf1322", fontSize: 16 }}>
                          🔴 BUỔI HỌC TRỰC TUYẾN ĐANG DIỄN RA
                        </Text>
                      }
                    />
                    {activeSession?.sessionNumber && (
                      <Tag color="volcano">Buổi số #{activeSession.sessionNumber}</Tag>
                    )}
                  </Space>

                  <Tag color="cyan" style={{ fontSize: 13, fontFamily: "monospace" }}>
                    Room: {currentRoomName}
                  </Tag>

                  <Tag color="blue" style={{ fontSize: 13 }}>
                    Học sinh tham gia: {activeCount}
                  </Tag>
                </div>

                <Paragraph style={{ fontSize: 14, color: "#595959", margin: 0 }}>
                  Buổi học <b>{activeSession?.title}</b> của lớp <b>{className}</b> đang được bật.
                  Học sinh có thể tham gia vào phòng học ngay lúc này.
                </Paragraph>

                <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                  <Button
                    type="primary"
                    danger
                    size="large"
                    icon={<PlayCircleOutlined />}
                    loading={isActionLoading}
                    onClick={handleJoin}
                    style={{
                      fontWeight: 700,
                      borderRadius: 8,
                      height: 44,
                      paddingLeft: 24,
                      paddingRight: 24,
                    }}
                  >
                    Tham gia phòng học ngay
                  </Button>

                  <Popconfirm
                    title="Kết thúc buổi học trực tuyến này?"
                    description="Kết thúc buổi học sẽ đóng phiên đối với toàn bộ học sinh. Hành động này không thể hoàn tác."
                    onConfirm={handleEnd}
                    okText="Kết thúc buổi học"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true, loading: isEnding }}
                    disabled={isEnding}
                  >
                    <Button
                      type="default"
                      size="large"
                      icon={<StopOutlined />}
                      loading={isEnding}
                      disabled={isEnding}
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
                <Paragraph
                  type="secondary"
                  style={{ maxWidth: 600, margin: "0 auto 24px", fontSize: 14 }}
                >
                  Bấm vào nút bên dưới để tự động tạo phiên học trực tuyến 8x8 JaaS. Hệ thống sẽ
                  phát thông báo thời gian thực tới tất cả học sinh trong lớp.
                </Paragraph>

                <Button
                  type="primary"
                  size="large"
                  icon={<VideoCameraOutlined />}
                  loading={isActionLoading}
                  onClick={handleStart}
                  style={{
                    fontWeight: 700,
                    borderRadius: 8,
                    height: 48,
                    paddingLeft: 32,
                    paddingRight: 32,
                    fontSize: 16,
                  }}
                >
                  Bắt đầu phòng LIVE ngay
                </Button>
              </div>
            )}
          </Card>

          {/* 3. Guidelines */}
          <Card title="📌 Thông tin & Hướng dẫn phòng học Live" style={{ borderRadius: 12 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
              <Descriptions.Item label="Lớp học">{className}</Descriptions.Item>
              <Descriptions.Item label="Phân quyền">
                {teacherName} (Giáo viên chủ trì - Host)
              </Descriptions.Item>
              <Descriptions.Item label="Công nghệ Video Call">
                8x8 JaaS / Jitsi Meet WebRTC
              </Descriptions.Item>
              <Descriptions.Item label="Bảo mật Token">
                RS256 JWT Signed Token (Scoped Room)
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      </LiveSessionErrorBoundary>
    );
  }
);

TeacherLiveSessionTab.displayName = "TeacherLiveSessionTab";

export default TeacherLiveSessionTab;
