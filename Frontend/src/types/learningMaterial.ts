export type MaterialType =
  | "Document"
  | "Video"
  | "Link"
  | "PDF"
  | "Slide"
  | "Word"
  | "Excel"
  | "PowerPoint"
  | "ZIP"
  | "Image"
  | "Other";

export interface IUploaderInfo {
  _id?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

export interface ILearningMaterial {
  _id: string;
  title: string;
  description?: string;
  type: MaterialType | string;
  url: string;
  uploadedBy?: IUploaderInfo | string;
  uploadedAt?: string;
  size?: string;
}

export interface MaterialFilterOptions {
  searchQuery: string;
  typeFilter: string; // "all", "Document", "Video", "Link", "PDF", "Slide", "Image", etc.
  sortBy: "newest" | "oldest" | "name_asc" | "name_desc";
}

export interface MaterialStats {
  total: number;
  pdf: number;
  video: number;
  link: number;
  slide: number;
  other: number;
}
