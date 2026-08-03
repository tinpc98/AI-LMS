/**
 * Design System Tokens — EduSpace Frontend
 * Single Source of Truth for Colors, Radius, and Spacing.
 */

// ==========================================
// TẦNG 1: PALETTE LAYER (Raw Values)
// Component KHÔNG dùng trực tiếp tầng này
// ==========================================
export const palette = {
  blue: {
    50: "#EDF5FC",
    100: "#CBE3F6",
    500: "#2D8CDB",
    600: "#2075BC",
    700: "#1E6DAE",
  },
  purple: {
    50: "#EEEDFD",
    100: "#D0CCFA",
    500: "#7A6FF0",
    600: "#584BEC",
    700: "#3D31C4",
  },
  pink: {
    50: "#FCEDF6",
    100: "#F8CEE6",
    500: "#E85BAA",
    600: "#E12D93",
    700: "#B62075",
  },
  neutral: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E5E7EB",
    divider: "#EEF2F7",
    title: "#1E293B",
    body: "#475569",
    description: "#64748B",
    disabled: "#94A3B8",
    sidebarBg: "#0F172A",
    sidebarHover: "#1E293B",
  },
  semantic: {
    success: {
      50: "#F0FDF4",
      base: "#22C55E",
      700: "#15803D",
    },
    warning: {
      50: "#FFFBEB",
      base: "#F59E0B",
      700: "#B45309",
    },
    error: {
      50: "#FEF2F2",
      base: "#EF4444",
      700: "#B91C1C",
    },
    info: {
      50: "#EFF6FF",
      base: "#3B82F6",
      700: "#1D4ED8",
    },
  },
} as const;

// ==========================================
// TẦNG 2: SEMANTIC TOKENS (Component Sử dụng)
// Đặt tên theo VAI TRÒ, không theo tên màu
// ==========================================
export const lightTokens = {
  color: {
    bg: {
      page: palette.neutral.background,
      surface: palette.neutral.surface,
      surfaceElevated: palette.neutral.surface,
      sidebar: palette.neutral.sidebarBg,
      sidebarHover: palette.neutral.sidebarHover,
      primaryTint: palette.blue[50],
      secondaryTint: palette.purple[50],
      accentTint: palette.pink[50],
    },
    text: {
      title: palette.neutral.title,
      body: palette.neutral.body,
      description: palette.neutral.description,
      disabled: palette.neutral.disabled,
      link: palette.blue[700],
      linkHover: palette.blue[600],
      inverse: "#FFFFFF",
      primary: palette.blue[700],
      secondary: palette.purple[600],
      accent: palette.pink[700],
    },
    action: {
      primaryBg: palette.blue[500],
      primaryHover: palette.blue[600],
      primaryActive: palette.blue[700],
      primaryText: palette.blue[700],
      focusRing: palette.blue[600],
    },
    border: {
      default: palette.neutral.border,
      divider: palette.neutral.divider,
      primaryTint: palette.blue[100],
      secondaryTint: palette.purple[100],
      accentTint: palette.pink[100],
    },
    secondary: {
      bg: palette.purple[50],
      border: palette.purple[100],
      icon: palette.purple[500],
      text: palette.purple[600],
      active: palette.purple[700],
    },
    accent: {
      base: palette.pink[500],
      bg: palette.pink[50],
      border: palette.pink[100],
      dot: palette.pink[500],
      text: palette.pink[700],
    },
    semantic: {
      success: {
        bg: palette.semantic.success[50],
        base: palette.semantic.success.base,
        text: palette.semantic.success[700],
      },
      warning: {
        bg: palette.semantic.warning[50],
        base: palette.semantic.warning.base,
        text: palette.semantic.warning[700],
      },
      error: {
        bg: palette.semantic.error[50],
        base: palette.semantic.error.base,
        text: palette.semantic.error[700],
      },
      info: {
        bg: palette.semantic.info[50],
        base: palette.semantic.info.base,
        text: palette.semantic.info[700],
      },
    },
    gradient: {
      primary: `linear-gradient(135deg, ${palette.blue[500]} 0%, ${palette.blue[700]} 100%)`,
      ai: `linear-gradient(90deg, ${palette.blue[500]}, ${palette.purple[500]})`,
      logo: `linear-gradient(135deg, ${palette.blue[500]}, ${palette.purple[500]})`,
    },
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  radiusPx: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 24,
    6: 32,
    7: 48,
    8: 64,
  },
  spacePx: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
    7: "48px",
    8: "64px",
  },
  alias: {
    cardPadding: "24px",
    sectionGap: "32px",
    pagePadding: "32px",
  },
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  },
  screens: {
    xs: "(max-width: 575.98px)",
    sm: "(min-width: 576px)",
    md: "(min-width: 768px)",
    lg: "(min-width: 992px)",
    xl: "(min-width: 1200px)",
    xxl: "(min-width: 1600px)",
  },
  duration: {
    instant: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "400ms",
  },
  durationMs: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 400,
  },
  easing: {
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  transition: {
    fast: "all 150ms cubic-bezier(0, 0, 0.2, 1)",
    normal: "all 200ms cubic-bezier(0, 0, 0.2, 1)",
    slow: "all 300ms cubic-bezier(0, 0, 0.2, 1)",
    color: "background-color 150ms cubic-bezier(0, 0, 0.2, 1), border-color 150ms cubic-bezier(0, 0, 0.2, 1), color 150ms cubic-bezier(0, 0, 0.2, 1)",
    transform: "transform 200ms cubic-bezier(0, 0, 0.2, 1)",
    fade: "opacity 200ms cubic-bezier(0, 0, 0.2, 1)",
  },
} as const;

export const darkTokens = {
  ...lightTokens,
  color: {
    bg: {
      page: "#0F172A",
      surface: "#1E293B",
      surfaceElevated: "#334155",
      sidebar: "#090D16",
      sidebarHover: "#1E293B",
      primaryTint: "rgba(45, 140, 219, 0.15)",
      secondaryTint: "rgba(122, 111, 240, 0.15)",
      accentTint: "rgba(232, 91, 170, 0.15)",
    },
    text: {
      title: "#F1F5F9",
      body: "#CBD5E1",
      description: "#94A3B8",
      disabled: "#64748B",
      link: "#60A5FA",
      linkHover: "#93C5FD",
      inverse: "#0F172A",
      primary: "#60A5FA",
      secondary: "#A59EF6",
      accent: "#F8CEE6",
    },
    action: {
      primaryBg: "#2D8CDB",
      primaryHover: "#3B9AE9",
      primaryActive: "#1E6DAE",
      primaryText: "#CBE3F6",
      focusRing: "#60A5FA",
    },
    border: {
      default: "#334155",
      divider: "#293548",
      primaryTint: "#1E4E79",
      secondaryTint: "#372F7D",
      accentTint: "#5C2346",
    },
    secondary: {
      bg: "rgba(122, 111, 240, 0.15)",
      border: "#372F7D",
      icon: "#D0CCFA",
      text: "#A59EF6",
      active: "#EEEDFD",
    },
    accent: {
      base: "#F472B6",
      bg: "rgba(232, 91, 170, 0.15)",
      border: "#5C2346",
      dot: "#F472B6",
      text: "#F8CEE6",
    },
    semantic: {
      success: {
        bg: "rgba(34, 197, 94, 0.15)",
        base: "#4ADE80",
        text: "#86EFAC",
      },
      warning: {
        bg: "rgba(245, 158, 11, 0.15)",
        base: "#FBBF24",
        text: "#FDE68A",
      },
      error: {
        bg: "rgba(239, 68, 68, 0.15)",
        base: "#F87171",
        text: "#FECACA",
      },
      info: {
        bg: "rgba(59, 130, 246, 0.15)",
        base: "#60A5FA",
        text: "#BFDBFE",
      },
    },
    gradient: {
      primary: "linear-gradient(135deg, #2D8CDB 0%, #1E6DAE 100%)",
      ai: "linear-gradient(90deg, #2D8CDB, #7A6FF0)",
      logo: "linear-gradient(135deg, #2D8CDB, #7A6FF0)",
    },
  },
} as const;

export interface DesignTokens {
  readonly color: {
    readonly bg: {
      readonly page: string;
      readonly surface: string;
      readonly surfaceElevated: string;
      readonly sidebar: string;
      readonly sidebarHover: string;
      readonly primaryTint: string;
      readonly secondaryTint: string;
      readonly accentTint: string;
    };
    readonly text: {
      readonly title: string;
      readonly body: string;
      readonly description: string;
      readonly disabled: string;
      readonly link: string;
      readonly linkHover: string;
      readonly inverse: string;
      readonly primary: string;
      readonly secondary: string;
      readonly accent: string;
    };
    readonly action: {
      readonly primaryBg: string;
      readonly primaryHover: string;
      readonly primaryActive: string;
      readonly primaryText: string;
      readonly focusRing: string;
    };
    readonly border: {
      readonly default: string;
      readonly divider: string;
      readonly primaryTint: string;
      readonly secondaryTint: string;
      readonly accentTint: string;
    };
    readonly secondary: {
      readonly bg: string;
      readonly border: string;
      readonly icon: string;
      readonly text: string;
      readonly active: string;
    };
    readonly accent: {
      readonly base: string;
      readonly bg: string;
      readonly border: string;
      readonly dot: string;
      readonly text: string;
    };
    readonly semantic: {
      readonly success: { readonly bg: string; readonly base: string; readonly text: string };
      readonly warning: { readonly bg: string; readonly base: string; readonly text: string };
      readonly error: { readonly bg: string; readonly base: string; readonly text: string };
      readonly info: { readonly bg: string; readonly base: string; readonly text: string };
    };
    readonly gradient: {
      readonly primary: string;
      readonly ai: string;
      readonly logo: string;
    };
  };
  readonly radius: typeof lightTokens.radius;
  readonly radiusPx: typeof lightTokens.radiusPx;
  readonly space: typeof lightTokens.space;
  readonly spacePx: typeof lightTokens.spacePx;
  readonly alias: typeof lightTokens.alias;
  readonly breakpoints: typeof lightTokens.breakpoints;
  readonly screens: typeof lightTokens.screens;
  readonly duration: typeof lightTokens.duration;
  readonly durationMs: typeof lightTokens.durationMs;
  readonly easing: typeof lightTokens.easing;
  readonly transition: typeof lightTokens.transition;
}

export const tokens: DesignTokens = lightTokens;

export function getTokens(isDark: boolean): DesignTokens {
  return isDark ? darkTokens : lightTokens;
}

export const breakpoints = tokens.breakpoints;
export const screens = tokens.screens;
