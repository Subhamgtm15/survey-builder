import axios from "axios";
import { useAuthStore } from "../store/authStore";
import type { Survey, Question, Analytics, AnswerMap } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// Attach the admin Bearer token to every request when present.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Log the admin out automatically if the token is rejected.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

interface SurveyPayload {
  title: string;
  description: string;
  questions: Question[];
  isPublished: boolean;
}

export const login = async (email: string, password: string): Promise<string> => {
  const res = await api.post("/auth/login", { email, password });
  return res.data.token;
};

export const listSurveys = async (): Promise<Survey[]> => {
  const res = await api.get("/surveys");
  return res.data.surveys;
};

export const getSurvey = async (id: number | string): Promise<Survey> => {
  const res = await api.get(`/surveys/${id}`);
  return res.data.survey;
};

export const createSurvey = async (payload: SurveyPayload): Promise<Survey> => {
  const res = await api.post("/surveys", payload);
  return res.data.survey;
};

export const updateSurvey = async (
  id: number | string,
  payload: SurveyPayload
): Promise<Survey> => {
  const res = await api.put(`/surveys/${id}`, payload);
  return res.data.survey;
};

export const deleteSurvey = async (id: number | string): Promise<void> => {
  await api.delete(`/surveys/${id}`);
};

export const getAnalytics = async (id: number | string): Promise<Analytics> => {
  const res = await api.get(`/surveys/${id}/analytics`);
  return res.data;
};

export const getPublicSurvey = async (id: number | string): Promise<Survey> => {
  const res = await api.get(`/public/surveys/${id}`);
  return res.data.survey;
};

export const submitResponse = async (
  id: number | string,
  answers: AnswerMap
): Promise<void> => {
  await api.post(`/public/surveys/${id}/responses`, { answers });
};

export default api;
