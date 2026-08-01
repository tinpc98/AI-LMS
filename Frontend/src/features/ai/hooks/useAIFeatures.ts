import { useState } from "react";
import { message } from "antd";
import type { AIFeature } from "../types/aiManagement.types";
import { mockAIFeatures } from "../mock/features.mock";

export const useAIFeatures = () => {
  const [features, setFeatures] = useState<AIFeature[]>(mockAIFeatures);
  const [search, setSearch] = useState("");

  const filteredFeatures = features.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      item.description.toLowerCase().includes(search.toLowerCase().trim())
  );

  const toggleFeature = (id: string) => {
    setFeatures((prev) =>
      prev.map((feat) => {
        if (feat.id === id) {
          const nextState = !feat.enabled;
          message.success(`Feature "${feat.name}" is now ${nextState ? "Enabled" : "Disabled"}`);
          return { ...feat, enabled: nextState };
        }
        return feat;
      })
    );
  };

  const updateFeatureModel = (featureId: string, modelId: string) => {
    setFeatures((prev) =>
      prev.map((feat) => (feat.id === featureId ? { ...feat, assignedModelId: modelId } : feat))
    );
    message.success("Feature model updated.");
  };

  return {
    features,
    filteredFeatures,
    search,
    setSearch,
    toggleFeature,
    updateFeatureModel,
  };
};
