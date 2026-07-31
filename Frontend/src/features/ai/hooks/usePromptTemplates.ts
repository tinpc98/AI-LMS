import { useState } from "react";
import { message } from "antd";
import type { PromptTemplate } from "../types/aiManagement.types";
import { mockPromptTemplates } from "../mock/prompts.mock";

export const usePromptTemplates = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(mockPromptTemplates);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredPrompts = prompts.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      item.description.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const togglePromptStatus = (id: string) => {
    setPrompts((prev) =>
      prev.map((prompt) => {
        if (prompt.id === id) {
          const nextStatus = prompt.status === "Active" ? "Disabled" : "Active";
          message.success(`Prompt "${prompt.name}" status changed to ${nextStatus}`);
          return { ...prompt, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return prompt;
      })
    );
  };

  const duplicatePrompt = (prompt: PromptTemplate) => {
    const duplicated: PromptTemplate = {
      ...prompt,
      id: `p-${Date.now()}`,
      name: `${prompt.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPrompts((prev) => [duplicated, ...prev]);
    message.success(`Duplicated prompt template: ${duplicated.name}`);
  };

  const addPrompt = (promptData: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">) => {
    const newPrompt: PromptTemplate = {
      ...promptData,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPrompts((prev) => [newPrompt, ...prev]);
    message.success(`Prompt "${newPrompt.name}" created successfully.`);
  };

  const updatePrompt = (id: string, promptData: Partial<PromptTemplate>) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...promptData, updatedAt: new Date().toISOString() } : p
      )
    );
    message.success("Prompt updated successfully.");
  };

  const deletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    message.success("Prompt template deleted.");
  };

  return {
    prompts,
    filteredPrompts,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    togglePromptStatus,
    duplicatePrompt,
    addPrompt,
    updatePrompt,
    deletePrompt,
  };
};
