import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Typography, Progress, Tooltip, Empty, Skeleton } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import learningApi from "../../../../api/learningApi";
import { tokens } from "../../../../shared/theme/tokens";

const { Title, Text } = Typography;

// TÍNH NĂNG MỚI (mục 4/5): widget "Thành tích của tôi" — Level/XP + badge đã đạt được, dữ liệu
// thật lần đầu tiên có nơi hiển thị (trước đây getMyBadges() tồn tại nhưng không nơi nào gọi).
export const AchievementsCard: React.FC = () => {
  const { data: xp, isLoading: isLoadingXp } = useQuery({
    queryKey: ["learning", "xp", "me"],
    queryFn: () => learningApi.getMyXp(),
  });

  const { data: badges = [], isLoading: isLoadingBadges } = useQuery({
    queryKey: ["learning", "badges", "me"],
    queryFn: () => learningApi.getMyBadges(),
  });

  const isLoading = isLoadingXp || isLoadingBadges;

  return (
    <Card
      title={
        <>
          <TrophyOutlined style={{ color: "#faad14", marginRight: 8 }} />
          Thành tích của tôi
        </>
      }
      style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", height: "100%" }}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <>
          {xp && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text strong>Level {xp.level}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {xp.xpIntoLevel}/{xp.xpForNextLevel} XP · tổng {xp.totalXp} XP
                </Text>
              </div>
              <Progress
                percent={Math.round((xp.xpIntoLevel / xp.xpForNextLevel) * 100)}
                strokeColor={{ "0%": "#faad14", "100%": "#fa8c16" }}
                showInfo={false}
              />
            </div>
          )}

          {badges.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Chưa có huy hiệu nào — hoàn thành bài giảng, điểm danh đầy đủ hoặc nộp bài đúng
                  hạn để nhận huy hiệu đầu tiên!
                </Text>
              }
            />
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {badges.map((badge) => (
                <Tooltip
                  key={badge._id}
                  title={
                    <div>
                      <div style={{ fontWeight: 600 }}>{badge.title}</div>
                      <div>{badge.description}</div>
                      <div style={{ marginTop: 4, opacity: 0.75, fontSize: 12 }}>
                        Đạt được: {dayjs(badge.awardedAt).format("DD/MM/YYYY")}
                      </div>
                    </div>
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: 76,
                      cursor: "default",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)",
                        border: `2px solid ${tokens.color.action.primaryBg}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                      }}
                    >
                      {badge.icon}
                    </div>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        textAlign: "center",
                        marginTop: 6,
                        lineHeight: 1.2,
                      }}
                    >
                      {badge.title}
                    </Text>
                  </div>
                </Tooltip>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default AchievementsCard;
