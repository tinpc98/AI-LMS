import { useState } from "react";
import { message } from "antd";
import type { AIConfiguration } from "../types/aiManagement.types";
import { mockAIConfig } from "../mock/config.mock";

export const useAIConfiguration = () => {
  const [config, setConfig] = useState<AIConfiguration>(mockAIConfig);
  const [saving, setSaving] = useState(false);

  const saveConfiguration = (newConfig: AIConfiguration) => {
    setSaving(true);
    setTimeout(() => {
      setConfig(newConfig);
      setSaving(false);
      message.success("AI Configuration saved successfully!");
    }, 600);
  };

  const resetToDefault = () => {
    setConfig(mockAIConfig);
    message.info("Configuration reset to system defaults.");
  };

  return {
    config,
    saving,
    saveConfiguration,
    resetToDefault,
  };
};
