import React, { useState, useEffect } from "react";
import { Select, Typography, Spin, Alert, Empty } from "antd";
import { TeacherExamsTab } from "../../class/components/classroom/TeacherExamsTab";
import { classApi } from "../../../api/classApi";
import type { IClass } from "../../../interface/ClassInterface";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { tokens } from "../../../shared/theme/tokens";

const { Title } = Typography;

export default function TeacherGlobalExamsPage() {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await classApi.getMyClasses();
        const classList = (response.data as any)?.data || response.data || [];
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0]._id);
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Không thể tải danh sách lớp học."));
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin tip="Đang tải danh sách lớp..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <Alert message="Lỗi" description={error} type="error" showIcon />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <Empty description="Bạn chưa được phân công lớp học nào." />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1400,
        margin: "0 auto",
        backgroundColor: tokens.color.bg.page,
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Quản lý Thi cử
        </Title>
        <Select
          style={{ width: 300 }}
          placeholder="Chọn lớp học"
          value={selectedClassId}
          onChange={(val) => setSelectedClassId(val)}
          options={classes.map((c) => ({ value: c._id, label: c.name }))}
        />
      </div>

      {selectedClassId && (
        <TeacherExamsTab
          classId={selectedClassId}
          className={classes.find((c) => c._id === selectedClassId)?.name || "Lớp học"}
        />
      )}
    </div>
  );
}
