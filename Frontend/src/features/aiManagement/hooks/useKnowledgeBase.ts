import { useState } from "react";
import { message } from "antd";
import type { KnowledgeDocument } from "../types/aiManagement.types";
import { mockKnowledgeDocs } from "../mock/knowledge.mock";

export const useKnowledgeBase = () => {
  const [docs, setDocs] = useState<KnowledgeDocument[]>(mockKnowledgeDocs);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  const filteredDocs = docs.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: docs.length,
    indexed: docs.filter((d) => d.status === "Indexed").length,
    pending: docs.filter((d) => d.status === "Pending").length,
    failed: docs.filter((d) => d.status === "Failed").length,
  };

  const reindexDocument = (id: string) => {
    setReindexingId(id);
    message.loading({ content: "Re-indexing document embeddings...", key: "reindex" });

    setTimeout(() => {
      setDocs((prev) =>
        prev.map((doc) => {
          if (doc.id === id) {
            return {
              ...doc,
              status: "Indexed",
              chunksCount: doc.chunksCount > 0 ? doc.chunksCount : Math.floor(doc.fileSizeMB * 80),
              updatedAt: new Date().toISOString(),
            };
          }
          return doc;
        })
      );
      setReindexingId(null);
      message.success({ content: "Document successfully re-indexed!", key: "reindex" });
    }, 1200);
  };

  const deleteDocument = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    message.success("Document removed from knowledge base.");
  };

  const addDocument = (docData: Omit<KnowledgeDocument, "id" | "createdAt" | "updatedAt" | "chunksCount">) => {
    const newDoc: KnowledgeDocument = {
      ...docData,
      id: `k-${Date.now()}`,
      chunksCount: Math.floor(docData.fileSizeMB * 75),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocs((prev) => [newDoc, ...prev]);
    message.success(`Uploaded "${newDoc.name}". Indexing initiated.`);
  };

  return {
    docs,
    filteredDocs,
    stats,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    reindexingId,
    reindexDocument,
    deleteDocument,
    addDocument,
  };
};
