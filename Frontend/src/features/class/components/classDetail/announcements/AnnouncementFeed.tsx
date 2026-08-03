import React from "react";
import { Typography, Divider } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import AnnouncementCard from "./AnnouncementCard";
import type { IExtendedAnnouncement } from "../../../../../types/studentAnnouncement";

const { Text } = Typography;

interface AnnouncementFeedGroup {
  groupTitle: string;
  items: IExtendedAnnouncement[];
}

interface AnnouncementFeedProps {
  groups: AnnouncementFeedGroup[];
  onDetail: (item: IExtendedAnnouncement) => void;
}

export const AnnouncementFeed: React.FC<AnnouncementFeedProps> = React.memo(
  ({ groups, onDetail }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {groups.map((group) => (
          <div key={group.groupTitle}>
            {/* Group Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ClockCircleOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 14 }} />
              <Text
                strong
                style={{
                  fontSize: 13,
                  color: "var(--color-text-description)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {group.groupTitle} ({group.items.length})
              </Text>
              <Divider style={{ margin: 0, flex: 1 }} />
            </div>

            {/* Feed Cards List */}
            <div>
              {group.items.map((item) => (
                <AnnouncementCard key={item._id} item={item} onDetail={onDetail} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

AnnouncementFeed.displayName = "AnnouncementFeed";

export default AnnouncementFeed;
