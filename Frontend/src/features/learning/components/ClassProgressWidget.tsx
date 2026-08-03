import React, { useState } from "react";
import { Card, Typography, Progress, Button, Tooltip } from "antd";
import { BookOutlined, DownOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { ClassProgressItem } from "../types/learningDashboard.types";

const { Text } = Typography;

const INITIAL_SHOW = 5;

interface ClassProgressWidgetProps {
  classProgress: ClassProgressItem[];
}

export const ClassProgressWidget: React.FC<ClassProgressWidgetProps> = React.memo(
  ({ classProgress }) => {
    const [showAll, setShowAll] = useState(false);

    const displayed = showAll ? classProgress : classProgress.slice(0, INITIAL_SHOW);
    const hasMore = classProgress.length > INITIAL_SHOW;

    return (
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 16 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-title)" }}>
              Hoàn thành bài tập theo lớp
            </span>
            <Text
              style={{
                fontSize: 12,
                color: "var(--color-text-description)",
                backgroundColor: "var(--color-bg-page)",
                borderRadius: 8,
                padding: "1px 8px",
                fontWeight: 500,
              }}
            >
              {classProgress.length} môn
            </Text>
            <Tooltip
              title="Tỉ lệ bài đã nộp / tổng số bài có trong hệ thống (≤ 5 lớp đầu tiên). Lớp chưa có dữ liệu hiển thị 'Chưa có dữ liệu'."
              placement="right"
            >
              <InfoCircleOutlined style={{ fontSize: 13, color: "var(--color-text-disabled)", cursor: "help" }} />
            </Tooltip>
          </div>
        }
        style={{
          borderRadius: 20,
          border: "1px solid var(--color-border-default)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
        styles={{ body: { padding: "16px 20px 20px" } }}
      >
        {classProgress.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "var(--color-text-disabled)",
              fontSize: 13,
              fontStyle: "italic",
            }}
          >
            Bạn chưa đăng ký lớp học nào.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {displayed.map((item, index) => {
                const hasData = item.progressPercent !== null;
                const pct = item.progressPercent ?? 0;

                // Màu thanh phản ánh mức độ hoàn thành
                const strokeColor = !hasData
                  ? "var(--color-border-default)"
                  : pct >= 80
                  ? "var(--color-success-base)"
                  : pct >= 50
                  ? "var(--color-action-primary-bg)"
                  : pct > 0
                  ? "var(--color-warning-base)"
                  : "var(--color-error-base)";

                return (
                  <div key={item.classId}>
                    {/* Row: số thứ tự + tên lớp + GV + chỉ số */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      {/* Left: index + class name */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            backgroundColor: "var(--color-bg-primary-tint)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--color-action-primary-bg)",
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </div>
                        <Text
                          strong
                          style={{
                            fontSize: 13,
                            color: "var(--color-text-title)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.className}
                        </Text>
                      </div>

                      {/* Right: teacher + progress value */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: "var(--color-text-disabled)" }}>
                          GV: {item.teacherName}
                        </Text>

                        {hasData ? (
                          <div style={{ textAlign: "right" }}>
                            <Text
                              strong
                              style={{
                                fontSize: 13,
                                color: strokeColor,
                                display: "block",
                                lineHeight: 1.2,
                              }}
                            >
                              {item.progressPercent}%
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: "var(--color-text-disabled)",
                                display: "block",
                                lineHeight: 1.2,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.completedAssignments}/{item.totalAssignments} bài
                            </Text>
                          </div>
                        ) : (
                          <Text
                            style={{
                              fontSize: 11,
                              color: "var(--color-text-disabled)",
                              fontStyle: "italic",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Chưa có dữ liệu
                          </Text>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <Progress
                      percent={pct}
                      strokeColor={strokeColor}
                      trailColor={hasData ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.04)"}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Button
                  type="text"
                  size="small"
                  icon={
                    <DownOutlined
                      style={{
                        transform: showAll ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform var(--duration-fast) var(--ease-out)",
                        fontSize: 11,
                      }}
                    />
                  }
                  onClick={() => setShowAll(!showAll)}
                  style={{
                    color: "var(--color-action-primary-bg)",
                    fontWeight: 500,
                    fontSize: 13,
                    borderRadius: 8,
                    paddingInline: 16,
                  }}
                >
                  {showAll
                    ? "Thu gọn"
                    : `Xem thêm ${classProgress.length - INITIAL_SHOW} môn`}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    );
  }
);

ClassProgressWidget.displayName = "ClassProgressWidget";

export default ClassProgressWidget;
