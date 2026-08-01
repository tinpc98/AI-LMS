import React from "react";
import { Card, Typography, Skeleton, Empty, Avatar, List, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import type { DashboardResponse } from "../dashboard.types";

const { Title, Text } = Typography;

interface RecentUsersTableProps {
  users: DashboardResponse["recentUsers"];
  loading?: boolean;
}

export const RecentUsersTable: React.FC<RecentUsersTableProps> = ({ users, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      style={{ height: "100%" }}
    >
      <Card
        variant="borderless"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          height: "100%",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Người dùng mới ⚡
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              Tài khoản vừa được tạo trên hệ thống
            </Text>
          </div>
        </div>

        {loading ? (
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        ) : users.length === 0 ? (
          <Empty description="Không có người dùng mới" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={users}
            renderItem={(user) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={user.avatar}
                      icon={!user.avatar && <UserOutlined />}
                      size="large"
                      style={{ backgroundColor: "#1677ff" }}
                    />
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: 600 }}>{user.fullName}</Text>
                      <Tag
                        color={
                          user.role === "Teacher"
                            ? "orange"
                            : user.role === "Admin"
                              ? "red"
                              : "blue"
                        }
                      >
                        {user.role}
                      </Tag>
                    </div>
                  }
                  description={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {user.email}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </motion.div>
  );
};
