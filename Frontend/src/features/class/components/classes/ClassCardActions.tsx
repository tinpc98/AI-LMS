import React from "react";
import { Button, Space, Badge } from "antd";
import { VideoCameraOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { StudentClassStatus } from "../../../../types/studentClass";

interface ClassCardActionsProps {
  classId: string;
  status: StudentClassStatus;
  isLiveActive?: boolean;
}

export const ClassCardActions: React.FC<ClassCardActionsProps> = React.memo(
  ({ classId, status, isLiveActive = false }) => {
    const navigate = useNavigate();

    const isActive = status === "Active" || status === "active";

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
              color="#ff4d4f"
              text={
                <span style={{ color: "#ff4d4f", fontWeight: 600, fontSize: 12 }}>
                  🔴 Đang trực tuyến
                </span>
              }
            />
          )}
        </div>

        <Space size={8}>
          {isActive && (
            <Button
              type="primary"
              danger={isLiveActive}
              icon={isLiveActive ? <VideoCameraOutlined /> : undefined}
              size="small"
              onClick={() => navigate(`/student/classdetail/${classId}`)}
              style={{ borderRadius: 8 }}
            >
              Vào lớp
            </Button>
          )}

          <Button
            type="default"
            size="small"
            onClick={() => navigate(`/student/classdetail/${classId}`)}
            style={{ borderRadius: 8 }}
          >
            Chi tiết lớp <RightOutlined style={{ fontSize: 10 }} />
          </Button>
        </Space>
      </div>
    );
  }
);

ClassCardActions.displayName = "ClassCardActions";

export default ClassCardActions;
