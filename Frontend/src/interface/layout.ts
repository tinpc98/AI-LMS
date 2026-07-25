import type { ReactNode } from "react";

export interface AdminMenuItem {
  key: string;
  label: string;
  path: string;
  icon?: ReactNode;
  children?: AdminMenuItem[];
}
