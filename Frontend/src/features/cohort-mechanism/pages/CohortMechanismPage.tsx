import React from "react";
import { Card, Tabs, Typography } from "antd";
import { ApartmentOutlined } from "@ant-design/icons";
import EscalationQueueTab from "../components/EscalationQueueTab";
import CommitmentManagerTab from "../components/CommitmentManagerTab";

const { Title, Text } = Typography;

// EduSpace mechanism design Phần A (cam kết + dạy đôi) / Phần B (chống lớp gãy giữa chừng).
export const CohortMechanismPage: React.FC = () => {
  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          <ApartmentOutlined className="mr-2 text-blue-500" />
          Cam kết & Leo thang
        </Title>
        <Text type="secondary">
          Quản lý cam kết giáo viên theo đợt, giáo viên dự bị, và xử lý các buổi học giáo viên vắng
          mặt không báo trước.
        </Text>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-sm" variant="borderless">
        <Tabs
          defaultActiveKey="escalation"
          items={[
            {
              key: "escalation",
              label: "Buổi học cần xử lý",
              children: <EscalationQueueTab />,
            },
            {
              key: "commitment",
              label: "Cam kết & Dạy đôi",
              children: <CommitmentManagerTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default CohortMechanismPage;
