import { useMemo, useState } from "react";
import { Card, Tabs } from "antd";
import {
  DashboardOutlined,
  RobotOutlined,
  FileTextOutlined,
  BookOutlined,
  AppstoreOutlined,
  SettingOutlined,
} from "@ant-design/icons";

// Subcomponents
import AIManagementHeader from "./components/AIManagementHeader";
import AIDashboard from "./components/AIDashboard";
import AIModelTable from "./components/AIModelTable";
import EditModelModal from "./components/EditModelModal";
import ModelDrawer from "./components/ModelDrawer";
import PromptTemplateTable from "./components/PromptTemplateTable";
import EditPromptModal from "./components/EditPromptModal";
import PromptDrawer from "./components/PromptDrawer";
import KnowledgeTable from "./components/KnowledgeTable";
import KnowledgeDrawer from "./components/KnowledgeDrawer";
import AddKnowledgeModal from "./components/AddKnowledgeModal";
import FeatureList from "./components/FeatureList";
import ConfigurationForm from "./components/ConfigurationForm";

// Custom Hooks
import { useAIModels } from "./hooks/useAIModels";
import { usePromptTemplates } from "./hooks/usePromptTemplates";
import { useKnowledgeBase } from "./hooks/useKnowledgeBase";
import { useAIFeatures } from "./hooks/useAIFeatures";
import { useAIConfiguration } from "./hooks/useAIConfiguration";

// Types
import type { AIModel, KnowledgeDocument, PromptTemplate } from "./types/aiManagement.types";

const AIManagementPage = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Hooks state
  const modelHook = useAIModels();
  const promptHook = usePromptTemplates();
  const knowledgeHook = useKnowledgeBase();
  const featureHook = useAIFeatures();
  const configHook = useAIConfiguration();

  // Modals & Drawers state
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelModalMode, setModelModalMode] = useState<"create" | "edit">("create");
  const [selectedModel, setSelectedModel] = useState<AIModel | undefined>();
  const [modelDrawerOpen, setModelDrawerOpen] = useState(false);

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptModalMode, setPromptModalMode] = useState<"create" | "edit">("create");
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | undefined>();
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);

  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | undefined>();
  const [knowledgeDrawerOpen, setKnowledgeDrawerOpen] = useState(false);

  // Compute Dashboard Stats
  const dashboardStats = useMemo(() => {
    const activeModelsCount = modelHook.models.filter((m) => m.status === "Active").length;
    const enabledFeaturesCount = featureHook.features.filter((f) => f.enabled).length;
    const todayRequestsCount = featureHook.features.reduce(
      (sum, f) => sum + (f.enabled ? f.dailyRequests : 0),
      0
    );
    const avgResponseTimeMs = 450;

    return {
      activeModelsCount,
      totalModelsCount: modelHook.models.length,
      promptTemplatesCount: promptHook.prompts.length,
      knowledgeDocsCount: knowledgeHook.docs.length,
      enabledFeaturesCount,
      totalFeaturesCount: featureHook.features.length,
      todayRequestsCount,
      avgResponseTimeMs,
    };
  }, [modelHook.models, promptHook.prompts, knowledgeHook.docs, featureHook.features]);

  // Model Modal Handlers
  const handleOpenCreateModel = () => {
    setModelModalMode("create");
    setSelectedModel(undefined);
    setModelModalOpen(true);
  };

  const handleOpenEditModel = (model: AIModel) => {
    setModelModalMode("edit");
    setSelectedModel(model);
    setModelModalOpen(true);
  };

  const handleOpenViewModel = (model: AIModel) => {
    setSelectedModel(model);
    setModelDrawerOpen(true);
  };

  const handleSubmitModel = (values: Omit<AIModel, "id" | "createdAt" | "updatedAt">) => {
    if (modelModalMode === "create") {
      modelHook.addModel(values);
    } else if (selectedModel) {
      modelHook.updateModel(selectedModel.id, values);
    }
    setModelModalOpen(false);
  };

  // Prompt Modal Handlers
  const handleOpenCreatePrompt = () => {
    setPromptModalMode("create");
    setSelectedPrompt(undefined);
    setPromptModalOpen(true);
  };

  const handleOpenEditPrompt = (prompt: PromptTemplate) => {
    setPromptModalMode("edit");
    setSelectedPrompt(prompt);
    setPromptModalOpen(true);
  };

  const handleOpenViewPrompt = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setPromptDrawerOpen(true);
  };

  const handleSubmitPrompt = (values: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">) => {
    if (promptModalMode === "create") {
      promptHook.addPrompt(values);
    } else if (selectedPrompt) {
      promptHook.updatePrompt(selectedPrompt.id, values);
    }
    setPromptModalOpen(false);
  };

  // Knowledge Modal Handlers
  const handleOpenCreateDoc = () => {
    setKnowledgeModalOpen(true);
  };

  const handleOpenViewDoc = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setKnowledgeDrawerOpen(true);
  };

  const tabItems = [
    {
      key: "dashboard",
      label: (
        <span>
          <DashboardOutlined /> Dashboard
        </span>
      ),
      children: <AIDashboard stats={dashboardStats} features={featureHook.features} />,
    },
    {
      key: "models",
      label: (
        <span>
          <RobotOutlined /> AI Models
        </span>
      ),
      children: (
        <AIModelTable
          data={modelHook.filteredModels}
          search={modelHook.search}
          onSearchChange={modelHook.setSearch}
          statusFilter={modelHook.statusFilter}
          onStatusFilterChange={modelHook.setStatusFilter}
          providerFilter={modelHook.providerFilter}
          onProviderFilterChange={modelHook.setProviderFilter}
          onView={handleOpenViewModel}
          onEdit={handleOpenEditModel}
          onToggleStatus={modelHook.toggleModelStatus}
          onSetDefault={modelHook.setDefaultModel}
          onCreate={handleOpenCreateModel}
        />
      ),
    },
    {
      key: "prompts",
      label: (
        <span>
          <FileTextOutlined /> Prompt Templates
        </span>
      ),
      children: (
        <PromptTemplateTable
          data={promptHook.filteredPrompts}
          models={modelHook.models}
          search={promptHook.search}
          onSearchChange={promptHook.setSearch}
          categoryFilter={promptHook.categoryFilter}
          onCategoryFilterChange={promptHook.setCategoryFilter}
          statusFilter={promptHook.statusFilter}
          onStatusFilterChange={promptHook.setStatusFilter}
          onView={handleOpenViewPrompt}
          onEdit={handleOpenEditPrompt}
          onDuplicate={promptHook.duplicatePrompt}
          onToggleStatus={promptHook.togglePromptStatus}
          onDelete={promptHook.deletePrompt}
          onCreate={handleOpenCreatePrompt}
        />
      ),
    },
    {
      key: "knowledge",
      label: (
        <span>
          <BookOutlined /> Knowledge Base
        </span>
      ),
      children: (
        <KnowledgeTable
          data={knowledgeHook.filteredDocs}
          stats={knowledgeHook.stats}
          search={knowledgeHook.search}
          onSearchChange={knowledgeHook.setSearch}
          categoryFilter={knowledgeHook.categoryFilter}
          onCategoryFilterChange={knowledgeHook.setCategoryFilter}
          statusFilter={knowledgeHook.statusFilter}
          onStatusFilterChange={knowledgeHook.setStatusFilter}
          reindexingId={knowledgeHook.reindexingId}
          onView={handleOpenViewDoc}
          onReindex={knowledgeHook.reindexDocument}
          onDelete={knowledgeHook.deleteDocument}
          onCreate={handleOpenCreateDoc}
        />
      ),
    },
    {
      key: "features",
      label: (
        <span>
          <AppstoreOutlined /> AI Features
        </span>
      ),
      children: (
        <FeatureList
          features={featureHook.filteredFeatures}
          models={modelHook.models}
          search={featureHook.search}
          onSearchChange={featureHook.setSearch}
          onToggleFeature={featureHook.toggleFeature}
          onUpdateFeatureModel={featureHook.updateFeatureModel}
        />
      ),
    },
    {
      key: "configuration",
      label: (
        <span>
          <SettingOutlined /> AI Configuration
        </span>
      ),
      children: (
        <ConfigurationForm
          config={configHook.config}
          models={modelHook.models}
          saving={configHook.saving}
          onSave={configHook.saveConfiguration}
          onReset={configHook.resetToDefault}
        />
      ),
    },
  ];

  return (
    <div>
      <AIManagementHeader />

      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          style={{ marginBottom: 0 }}
        />
      </Card>

      {/* AI Model Modal & Drawer */}
      <EditModelModal
        open={modelModalOpen}
        mode={modelModalMode}
        initialValues={selectedModel}
        onSubmit={handleSubmitModel}
        onCancel={() => setModelModalOpen(false)}
      />

      <ModelDrawer
        open={modelDrawerOpen}
        model={selectedModel}
        onClose={() => setModelDrawerOpen(false)}
      />

      {/* Prompt Template Modal & Drawer */}
      <EditPromptModal
        open={promptModalOpen}
        mode={promptModalMode}
        initialValues={selectedPrompt}
        models={modelHook.models}
        onSubmit={handleSubmitPrompt}
        onCancel={() => setPromptModalOpen(false)}
      />

      <PromptDrawer
        open={promptDrawerOpen}
        prompt={selectedPrompt}
        models={modelHook.models}
        onClose={() => setPromptDrawerOpen(false)}
      />

      {/* Knowledge Document Modal & Drawer */}
      <AddKnowledgeModal
        open={knowledgeModalOpen}
        onSubmit={(docValues) => {
          knowledgeHook.addDocument(docValues);
          setKnowledgeModalOpen(false);
        }}
        onCancel={() => setKnowledgeModalOpen(false)}
      />

      <KnowledgeDrawer
        open={knowledgeDrawerOpen}
        doc={selectedDoc}
        onClose={() => setKnowledgeDrawerOpen(false)}
      />
    </div>
  );
};

export default AIManagementPage;
