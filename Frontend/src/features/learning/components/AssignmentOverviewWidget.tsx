import React from "react";
import { Card, Typography, Button } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { AssignmentSummaryItem } from "../types/learningDashboard.types";
import StatusBadge, { type StatusVariant } from "../../../shared/components/StatusBadge";

const { Text } = Typography;

// ─── Timezone helper ─────────────────────────────────────────────────────────
// Mốc so sánh dùng UTC timestamp thuần (ISO → ms) — timezone chỉ ảnh hưởng
// đến HIỂN THỊ ngày, không ảnh hưởng đến logic phân nhóm.
const VN_LOCALE = "vi-VN";
const VN_TZ = "Asia/Ho_Chi_Minh";

/** Số ms của thời điểm hiện tại */
const nowMs = (): number => Date.now();

/** Số ms còn lại đến deadline (âm = đã quá hạn) */
const msUntilDue = (dueDate: string): number =>
  new Date(dueDate).getTime() - nowMs();

/** "Trễ X ngày" hoặc "Trễ hôm nay" */
const formatOverdue = (dueDate: string): string => {
  const diffMs = nowMs() - new Date(dueDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Trễ hôm nay";
  if (days === 1) return "Trễ 1 ngày";
  return `Trễ ${days} ngày`;
};

/** "Còn X phút / X giờ / X ngày" */
const formatTimeLeft = (dueDate: string): string => {
  const diffMs = new Date(dueDate).getTime() - nowMs();
  if (diffMs <= 0) return "Hết hạn";
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `Còn ${days} ngày`;
  if (hours >= 1) return `Còn ${hours} giờ`;
  return `Còn ${totalMinutes} phút`;
};

/** Hiển thị ngày hết hạn theo múi giờ VN */
const formatDueDate = (dueDate: string): string =>
  new Date(dueDate).toLocaleDateString(VN_LOCALE, {
    timeZone: VN_TZ,
    day: "numeric",
    month: "numeric",
  });

// ─── Constants ───────────────────────────────────────────────────────────────
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PER_GROUP = 5;

// ─── Types ───────────────────────────────────────────────────────────────────
interface AssignmentOverviewWidgetProps {
  assignments: AssignmentSummaryItem[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Row chung cho một bài tập */
const AssignmentRow: React.FC<{
  item: AssignmentSummaryItem;
  timeLabel: string;
  timeLabelColor: string;
  rowBg: string;
  rowBorder: string;
  /** "overdue" | "upcoming" — maps trực tiếp tới StatusBadge variant */
  variant: StatusVariant;
}> = ({ item, timeLabel, timeLabelColor, rowBg, rowBorder, variant }) => (
  <div
    style={{
      backgroundColor: rowBg,
      borderRadius: 14,
      padding: "12px 16px",
      border: `1px solid ${rowBorder}`,
      transition: "box-shadow 0.2s ease",
    }}
  >
    {/* Title + Tag */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 6,
        gap: 8,
      }}
    >
      <Text strong style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.4, flex: 1 }}>
        {item.title}
      </Text>
      <StatusBadge variant={variant} style={{ flexShrink: 0 }} />
    </div>

    {/* Meta row */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* Left: class + due date */}
      <Text style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: "#8c8c8c" }}>{item.className}</span>
        <span style={{ color: "#d1d5db" }}>•</span>
        <ClockCircleOutlined style={{ fontSize: 11 }} />
        <span>{formatDueDate(item.dueDate)}</span>
      </Text>

      {/* Right: relative time + detail link */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: timeLabelColor,
            whiteSpace: "nowrap",
          }}
        >
          {timeLabel}
        </Text>
        {item.classId && (
          <Link to={`/student/classdetail/${item.classId}?tab=assignments`}>
            <Button
              type="link"
              size="small"
              style={{ fontSize: 12, padding: 0, color: "#1890ff", fontWeight: 500 }}
            >
              Chi tiết →
            </Button>
          </Link>
        )}
      </div>
    </div>
  </div>
);

/** Header của mỗi nhóm */
const GroupHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  count: number;
  badgeBg: string;
  badgeColor: string;
}> = ({ icon, title, count, badgeBg, badgeColor }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
    }}
  >
    {icon}
    <Text strong style={{ fontSize: 13, color: "#374151" }}>
      {title}
    </Text>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: badgeColor,
        backgroundColor: badgeBg,
        borderRadius: 8,
        padding: "1px 8px",
        lineHeight: "18px",
      }}
    >
      {count} bài
    </span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const AssignmentOverviewWidget: React.FC<AssignmentOverviewWidgetProps> = React.memo(
  ({ assignments }) => {
    // Lọc bài chưa nộp
    const unpublished = assignments.filter((a) => a.status !== "SUBMITTED");

    // Nhóm 1 — Quá hạn: dueDate < now, chưa nộp
    const overdue = unpublished
      .filter((a) => msUntilDue(a.dueDate) < 0)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // trễ nhất lên đầu

    // Nhóm 2 — Sắp đến hạn: 0 <= dueDate <= now+7d, chưa nộp
    const upcoming = unpublished
      .filter((a) => {
        const ms = msUntilDue(a.dueDate);
        return ms >= 0 && ms <= SEVEN_DAYS_MS;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // gần nhất lên đầu

    const hasOverdue = overdue.length > 0;
    const hasUpcoming = upcoming.length > 0;
    const bothEmpty = !hasOverdue && !hasUpcoming;

    // Số hiển thị cho badge card title — tổng bài cần hành động
    const totalActionable = overdue.length + upcoming.length;

    return (
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ color: "#1890ff", fontSize: 16 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>
              Bài tập cần làm
            </span>
            {totalActionable > 0 && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#8c8c8c",
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                  padding: "1px 8px",
                  fontWeight: 500,
                }}
              >
                {totalActionable} bài
              </Text>
            )}
          </div>
        }
        extra={
          <Link to="/student/studentassignment">
            <Button
              type="link"
              size="small"
              icon={<ArrowRightOutlined />}
              style={{ fontSize: 13, color: "#1890ff", padding: 0, fontWeight: 500 }}
            >
              Xem tất cả
            </Button>
          </Link>
        }
        style={{
          borderRadius: 20,
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
        styles={{ body: { padding: "8px 20px 20px" } }}
      >
        {/* ══ BOTH EMPTY ══ */}
        {bothEmpty && (
          <div
            style={{
              textAlign: "center",
              padding: "28px 0",
              color: "#6b7280",
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <Text strong style={{ fontSize: 14, color: "#374151", display: "block", marginBottom: 4 }}>
              Bạn đang rất đúng tiến độ!
            </Text>
            <Text style={{ fontSize: 12, color: "#9ca3af" }}>
              Không có bài nào quá hạn hay sắp đến hạn trong 7 ngày tới.
            </Text>
          </div>
        )}

        {/* ══ NHÓM 1: QUÁ HẠN ══ */}
        {hasOverdue && (
          <div style={{ marginTop: 12, marginBottom: hasUpcoming ? 20 : 0 }}>
            <GroupHeader
              icon={<ExclamationCircleOutlined style={{ color: "#cf1322", fontSize: 14 }} />}
              title="Quá hạn"
              count={overdue.length}
              badgeBg="#fff1f0"
              badgeColor="#cf1322"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {overdue.slice(0, MAX_PER_GROUP).map((item) => (
                <AssignmentRow
                  key={item.id}
                  item={item}
                  timeLabel={formatOverdue(item.dueDate)}
                  timeLabelColor="#cf1322"
                  rowBg="#fff5f5"
                  rowBorder="#ffa39e"
                  variant="overdue"
                />
              ))}
            </div>

            {overdue.length > MAX_PER_GROUP && (
              <div style={{ textAlign: "center", paddingTop: 10 }}>
                <Link to="/student/studentassignment">
                  <Button
                    type="default"
                    size="small"
                    danger
                    icon={<ArrowRightOutlined />}
                    style={{ borderRadius: 8, fontSize: 12, fontWeight: 500 }}
                  >
                    Xem thêm {overdue.length - MAX_PER_GROUP} bài quá hạn
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        {hasOverdue && hasUpcoming && (
          <div
            style={{
              height: 1,
              backgroundColor: "#f3f4f6",
              margin: "4px 0 16px",
            }}
          />
        )}

        {/* ══ NHÓM 2: SẮP ĐẾN HẠN ══ */}
        {hasUpcoming ? (
          <div style={{ marginTop: hasOverdue ? 0 : 12 }}>
            <GroupHeader
              icon={<WarningOutlined style={{ color: "#d46b08", fontSize: 14 }} />}
              title="Sắp đến hạn"
              count={upcoming.length}
              badgeBg="#fff7e6"
              badgeColor="#d46b08"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcoming.slice(0, MAX_PER_GROUP).map((item) => (
                <AssignmentRow
                  key={item.id}
                  item={item}
                  timeLabel={formatTimeLeft(item.dueDate)}
                  timeLabelColor="#d46b08"
                  rowBg="#fffbf0"
                  rowBorder="#ffd591"
                  variant="upcoming"
                />
              ))}
            </div>

            {upcoming.length > MAX_PER_GROUP && (
              <div style={{ textAlign: "center", paddingTop: 10 }}>
                <Link to="/student/studentassignment">
                  <Button
                    type="default"
                    size="small"
                    icon={<ArrowRightOutlined />}
                    style={{
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#d46b08",
                      borderColor: "#ffd591",
                    }}
                  >
                    Xem thêm {upcoming.length - MAX_PER_GROUP} bài sắp đến hạn
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Empty state cho nhóm Sắp đến hạn khi chỉ có nhóm Quá hạn */
          hasOverdue && (
            <div
              style={{
                textAlign: "center",
                padding: "12px 0 4px",
                color: "#9ca3af",
                fontSize: 12,
              }}
            >
              ✅ Không có bài nào sắp đến hạn trong 7 ngày tới.
            </div>
          )
        )}

        {/* Empty state: có bài quá hạn nhưng không có bài sắp đến hạn — đã xử lý bên trên */}
        {/* Empty state: không quá hạn nhưng không sắp đến hạn — xử lý ở bothEmpty */}
        {/* Case: không quá hạn nhưng có bài sắp đến hạn — handled above, no extra empty needed */}
      </Card>
    );
  }
);

AssignmentOverviewWidget.displayName = "AssignmentOverviewWidget";

export default AssignmentOverviewWidget;
