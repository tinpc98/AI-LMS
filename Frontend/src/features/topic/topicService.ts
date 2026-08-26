import axiosClient from "../../api/axiosClient";
import type {
  ApiResponse,
  CreateTopicPayload,
  TopicRecord,
  UpdateTopicPayload,
} from "./topic.types";

const mapTopic = (topic: any): TopicRecord => ({
  ...topic,
  id: topic._id || topic.id,
});

export const topicService = {
  async getTopicsByCourse(
    courseId: string,
    includeArchived = false
  ): Promise<ApiResponse<TopicRecord[]>> {
    const response = await axiosClient.get(`/topics/course/${courseId}`, {
      params: includeArchived ? { includeArchived: "true" } : undefined,
    });
    return { ...response.data, data: response.data.data.map(mapTopic) };
  },

  async createTopic(payload: CreateTopicPayload): Promise<ApiResponse<TopicRecord>> {
    const response = await axiosClient.post("/topics", payload);
    return { ...response.data, data: mapTopic(response.data.data) };
  },

  async updateTopic(id: string, payload: UpdateTopicPayload): Promise<ApiResponse<TopicRecord>> {
    const response = await axiosClient.patch(`/topics/${id}`, payload);
    return { ...response.data, data: mapTopic(response.data.data) };
  },

  async publishTopic(id: string): Promise<ApiResponse<TopicRecord>> {
    const response = await axiosClient.patch(`/topics/${id}/publish`);
    return { ...response.data, data: mapTopic(response.data.data) };
  },

  async archiveTopic(id: string): Promise<ApiResponse<TopicRecord>> {
    const response = await axiosClient.patch(`/topics/${id}/archive`);
    return { ...response.data, data: mapTopic(response.data.data) };
  },

  async reorderTopics(
    courseId: string,
    orderedTopicIds: string[]
  ): Promise<ApiResponse<TopicRecord[]>> {
    const response = await axiosClient.patch("/topics/reorder", { courseId, orderedTopicIds });
    return { ...response.data, data: response.data.data.map(mapTopic) };
  },

  async deleteTopic(id: string): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete(`/topics/${id}`);
    return response.data;
  },
};
