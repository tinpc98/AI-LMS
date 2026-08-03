import { theme, type ThemeConfig } from "antd";
import { getTokens, lightTokens, tokens } from "./tokens";

/**
 * Ant Design Theme Configuration Generator — EduSpace Frontend
 * Supports Light & Dark Modes synchronized with Design System Tokens
 */
export function getAntdTheme(isDark: boolean = false, prefersReducedMotion: boolean = false): ThemeConfig {
  const currentTokens = getTokens(isDark);

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      // Brand & Semantic Colors
      colorPrimary: currentTokens.color.action.primaryBg,
      colorSuccess: currentTokens.color.semantic.success.base,
      colorWarning: currentTokens.color.semantic.warning.base,
      colorError: currentTokens.color.semantic.error.base,
      colorInfo: currentTokens.color.semantic.info.base,

      // Neutral Colors
      colorBgLayout: currentTokens.color.bg.page,
      colorBgContainer: currentTokens.color.bg.surface,
      colorBgElevated: currentTokens.color.bg.surfaceElevated,
      colorTextBase: currentTokens.color.text.title,
      colorTextSecondary: currentTokens.color.text.description,
      colorTextDisabled: currentTokens.color.text.disabled,
      colorBorder: currentTokens.color.border.default,
      colorBorderSecondary: currentTokens.color.border.divider,
      colorSplit: currentTokens.color.border.divider,

      // Radius Tokens
      borderRadius: tokens.radius.md, // 8px
      borderRadiusLG: tokens.radius.lg, // 12px
      borderRadiusSM: tokens.radius.sm, // 4px
      borderRadiusXS: tokens.radius.sm, // 4px

      // Spacing Tokens
      paddingXS: tokens.space[2], // 8px
      padding: tokens.space[4], // 16px
      paddingLG: tokens.space[5], // 24px
      marginXS: tokens.space[2], // 8px
      margin: tokens.space[4], // 16px
      marginLG: tokens.space[5], // 24px

      // Element Dimensions
      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 48,

      // Focus & Interaction Tokens
      controlOutline: isDark ? "rgba(96, 165, 250, 0.3)" : "rgba(45, 140, 219, 0.2)",
      controlOutlineWidth: 2,

      // Motion Tokens (Giai đoạn 3C)
      motion: !prefersReducedMotion,
      motionDurationFast: "0.1s", // 100ms
      motionDurationMid: "0.15s", // 150ms
      motionDurationSlow: "0.3s", // 300ms
      motionEaseInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      motionEaseOut: "cubic-bezier(0, 0, 0.2, 1)",
    },
    components: {
      Button: {
        controlHeight: 40,
        controlHeightSM: 32,
        controlHeightLG: 48,
        paddingInline: tokens.space[4], // 16px
        paddingInlineSM: tokens.space[3], // 12px
        paddingInlineLG: tokens.space[5], // 24px
        fontWeight: 500,
        borderRadius: tokens.radius.md,
        borderRadiusLG: tokens.radius.md,
        borderRadiusSM: tokens.radius.sm,
        colorPrimary: currentTokens.color.action.primaryBg,
        colorPrimaryHover: currentTokens.color.action.primaryHover,
        colorPrimaryActive: currentTokens.color.action.primaryActive,
        primaryShadow: isDark ? "none" : "0 2px 6px rgba(45, 140, 219, 0.2)",
      },
      Input: {
        controlHeight: 40,
        controlHeightSM: 32,
        controlHeightLG: 48,
        paddingInline: tokens.space[3], // 12px
        paddingInlineSM: tokens.space[2], // 8px
        paddingInlineLG: tokens.space[4], // 16px
        borderRadius: tokens.radius.md,
        activeBorderColor: currentTokens.color.action.primaryBg,
        hoverBorderColor: currentTokens.color.action.primaryBg,
        activeShadow: isDark ? "0 0 0 2px rgba(96, 165, 250, 0.25)" : "0 0 0 2px rgba(45, 140, 219, 0.2)",
      },
      Select: {
        controlHeight: 40,
        controlHeightSM: 32,
        controlHeightLG: 48,
        borderRadius: tokens.radius.md,
        optionSelectedBg: isDark ? "rgba(45, 140, 219, 0.2)" : currentTokens.color.bg.primaryTint,
        optionSelectedColor: currentTokens.color.action.primaryText,
      },
      Card: {
        borderRadiusLG: tokens.radius.lg, // 12px
        paddingLG: tokens.space[5], // 24px
        headerHeight: 56,
        colorBorderSecondary: currentTokens.color.border.default,
      },
      Modal: {
        borderRadiusLG: tokens.radius.xl, // 16px
        headerBg: currentTokens.color.bg.surfaceElevated,
      },
      Alert: {
        borderRadiusLG: tokens.radius.md,
      },
      Table: {
        borderRadiusLG: tokens.radius.lg,
        headerBg: isDark ? "#172234" : currentTokens.color.bg.page,
        headerColor: currentTokens.color.text.title,
        rowHoverBg: isDark ? "rgba(45, 140, 219, 0.12)" : currentTokens.color.bg.primaryTint,
      },
      Tag: {
        borderRadiusSM: tokens.radius.sm, // 4px
        defaultBg: isDark ? "#293548" : currentTokens.color.bg.page,
        defaultColor: currentTokens.color.text.title,
      },
      Badge: {
        borderRadiusSM: tokens.radius.sm,
        colorError: currentTokens.color.semantic.error.base,
      },
      Dropdown: {
        borderRadiusLG: tokens.radius.md,
        controlItemBgHover: isDark ? "rgba(45, 140, 219, 0.15)" : currentTokens.color.bg.primaryTint,
      },
      DatePicker: {
        controlHeight: 40,
        controlHeightSM: 32,
        controlHeightLG: 48,
        borderRadius: tokens.radius.md,
      },
      Pagination: {
        borderRadius: tokens.radius.md,
        itemActiveBg: isDark ? "rgba(45, 140, 219, 0.25)" : currentTokens.color.bg.primaryTint,
      },
      Tabs: {
        itemSelectedColor: currentTokens.color.action.primaryBg,
        itemHoverColor: currentTokens.color.action.primaryHover,
        itemActiveColor: currentTokens.color.action.primaryActive,
        inkBarColor: currentTokens.color.action.primaryBg,
      },
      Segmented: {
        itemSelectedBg: currentTokens.color.bg.surface,
        itemSelectedColor: currentTokens.color.action.primaryBg,
        borderRadius: tokens.radius.md,
        borderRadiusSM: tokens.radius.sm,
      },
    },
  };
}

export const antdTheme: ThemeConfig = getAntdTheme(false);

