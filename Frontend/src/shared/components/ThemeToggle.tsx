import React from "react";
import { Dropdown, Button, Tooltip, Segmented, type MenuProps } from "antd";
import {
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useTheme, type ThemeMode } from "../context/ThemeContext";

interface ThemeToggleProps {
  variant?: "button" | "segmented" | "dropdown";
  size?: "small" | "middle" | "large";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "dropdown",
  size = "middle",
}) => {
  const { themeMode, isDark, setThemeMode } = useTheme();

  if (variant === "segmented") {
    return (
      <Segmented<ThemeMode>
        size={size}
        value={themeMode}
        onChange={(val) => setThemeMode(val)}
        options={[
          {
            value: "light",
            label: "Sáng",
            icon: <SunOutlined />,
          },
          {
            value: "dark",
            label: "Tối",
            icon: <MoonOutlined />,
          },
          {
            value: "system",
            label: "Hệ thống",
            icon: <DesktopOutlined />,
          },
        ]}
      />
    );
  }

  const items: MenuProps["items"] = [
    {
      key: "light",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
          <SunOutlined style={{ color: "#F59E0B" }} />
          <span style={{ flex: 1 }}>Giao diện Sáng</span>
          {themeMode === "light" && <CheckOutlined style={{ fontSize: 12, color: "#2D8CDB" }} />}
        </div>
      ),
      onClick: () => setThemeMode("light"),
    },
    {
      key: "dark",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
          <MoonOutlined style={{ color: "#818CF8" }} />
          <span style={{ flex: 1 }}>Giao diện Tối</span>
          {themeMode === "dark" && <CheckOutlined style={{ fontSize: 12, color: "#2D8CDB" }} />}
        </div>
      ),
      onClick: () => setThemeMode("dark"),
    },
    {
      key: "system",
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
          <DesktopOutlined style={{ color: "#64748B" }} />
          <span style={{ flex: 1 }}>Theo Hệ Thống</span>
          {themeMode === "system" && <CheckOutlined style={{ fontSize: 12, color: "#2D8CDB" }} />}
        </div>
      ),
      onClick: () => setThemeMode("system"),
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
      <Tooltip title={`Giao diện: ${themeMode === "light" ? "Sáng" : themeMode === "dark" ? "Tối" : "Theo hệ thống"}`}>
        <Button
          type="text"
          shape="circle"
          size={size}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: size === "small" ? 36 : 44,
            height: size === "small" ? 36 : 44,
          }}
          icon={
            isDark ? (
              <MoonOutlined style={{ fontSize: 18, color: "#818CF8" }} />
            ) : (
              <SunOutlined style={{ fontSize: 18, color: "#F59E0B" }} />
            )
          }
        />
      </Tooltip>
    </Dropdown>
  );
};
