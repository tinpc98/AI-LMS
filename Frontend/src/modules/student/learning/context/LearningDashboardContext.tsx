import React, { createContext, useContext } from "react";
import useLearningDashboard from "../hooks/useLearningDashboard";
import type { LearningDashboardState } from "../types/learningDashboard.types";

interface LearningDashboardContextValue extends LearningDashboardState {
  refresh: () => Promise<void>;
}

const LearningDashboardContext = createContext<LearningDashboardContextValue | null>(null);

export const LearningDashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dashboard = useLearningDashboard();

  return (
    <LearningDashboardContext.Provider value={dashboard}>
      {children}
    </LearningDashboardContext.Provider>
  );
};

export const useLearningDashboardContext = (): LearningDashboardContextValue => {
  const ctx = useContext(LearningDashboardContext);
  if (!ctx) {
    throw new Error("useLearningDashboardContext must be used within LearningDashboardProvider");
  }
  return ctx;
};
