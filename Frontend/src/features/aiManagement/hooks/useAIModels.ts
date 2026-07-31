import { useState } from "react";
import { message } from "antd";
import type { AIModel } from "../types/aiManagement.types";
import { mockAIModels } from "../mock/models.mock";

export const useAIModels = () => {
  const [models, setModels] = useState<AIModel[]>(mockAIModels);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [providerFilter, setProviderFilter] = useState<string>("All");

  const filteredModels = models.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      item.provider.toLowerCase().includes(search.toLowerCase().trim());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesProvider = providerFilter === "All" || item.provider === providerFilter;
    return matchesSearch && matchesStatus && matchesProvider;
  });

  const toggleModelStatus = (id: string) => {
    setModels((prev) =>
      prev.map((model) => {
        if (model.id === id) {
          const nextStatus = model.status === "Active" ? "Disabled" : "Active";
          message.success(`Model ${model.name} status updated to ${nextStatus}`);
          return { ...model, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return model;
      })
    );
  };

  const setDefaultModel = (id: string) => {
    setModels((prev) =>
      prev.map((model) => {
        if (model.id === id) {
          message.success(`${model.name} is now the default AI model.`);
          return {
            ...model,
            isDefault: true,
            status: "Active",
            updatedAt: new Date().toISOString(),
          };
        }
        return { ...model, isDefault: false };
      })
    );
  };

  const addModel = (modelData: Omit<AIModel, "id" | "createdAt" | "updatedAt">) => {
    const newModel: AIModel = {
      ...modelData,
      id: `m-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (newModel.isDefault) {
      setModels((prev) => prev.map((m) => ({ ...m, isDefault: false })).concat(newModel));
    } else {
      setModels((prev) => [...prev, newModel]);
    }
    message.success(`Model ${newModel.name} created successfully.`);
  };

  const updateModel = (id: string, modelData: Partial<AIModel>) => {
    setModels((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, ...modelData, updatedAt: new Date().toISOString() };
        }
        if (modelData.isDefault) {
          return { ...m, isDefault: false };
        }
        return m;
      })
    );
    message.success("Model updated successfully.");
  };

  return {
    models,
    filteredModels,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    providerFilter,
    setProviderFilter,
    toggleModelStatus,
    setDefaultModel,
    addModel,
    updateModel,
  };
};
