import React from "react";
import { Button, Space, Badge, Modal } from "antd";
import { VideoCameraOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { IStudentClass } from "../../../../types/studentClass";
import CohortFeedbackButton from "../../../cohort-feedback/components/CohortFeedbackButton";

const FEEDBACK_ELIGIBLE_COMMITMENT_STATUSES = ["COMPLETED", "COMPLETED_PARTIAL"];

interface ClassCardActionsProps {
  item: IStudentClass;
}

export const ClassCardActions: React.FC<ClassCardActionsProps> = React.memo(({ item }) => {
  const navigate = useNavigate();

  const isActive = item.status === "Active" || item.status === "active";
  const isLiveActive = item.isLiveActive || false;
  const isOnline = item.mode === "ONLINE";
  const isOffline = item.mode === "OFFLINE";
  const canReviewCohort =
    !!item.commitmentStatus &&
    FEEDBACK_ELIGIBLE_COMMITMENT_STATUSES.includes(item.commitmentStatus);

  const handleEnterLiveClass = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra thẻ Card (tránh redirect về chi tiết lớp)

    if (isLiveActive || (item as any).liveRoom?.isActive) {
      const link = (item as any).meetLink || `/student/live/${item._id}`;
      if (link.startsWith("http")) {
        window.open(link, "_blank");
      } else {
        navigate(link);
      }
    } else {
      Modal.warning({
        title: "Phòng học chưa mở",
        content: "Giáo viên chưa mở phòng học. Vui lòng chờ trong giây lát rồi thử lại!",
        okText: "Xem chi tiết lớp",
        cancelText: "Đóng",
        closable: true,
        okCancel: true,
        onOk: () => {
          navigate(`/student/classdetail/${item._id}`);
        },
        centered: true,
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginTop: 16,
      }}
    >
      <div>
        {isLiveActive && (
          <Badge
            status="processing"
            color="var(--color-error-base)"
            text={
              <span style={{ color: "var(--color-error-base)", fontWeight: 600, fontSize: 12 }}>
                🔴 Đang trực tuyến
              </span>
            }
          />
        )}
      </div>

      <Space size={8}>
        {isActive && isOnline && (
          <Button
            type="primary"
            danger={isLiveActive}
            icon={<VideoCameraOutlined />}
            size="small"
            onClick={handleEnterLiveClass}
            style={{ borderRadius: 8 }}
          >
            Vào học ngay
          </Button>
        )}
        {canReviewCohort && <CohortFeedbackButton classId={item._id} />}
      </Space>
    </div>
  );
});

ClassCardActions.displayName = "ClassCardActions";

export default ClassCardActions;
