import axios from "axios";

/* EKLENDİ - 2026-04-04 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:4000";
}

/* ADDED */
export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

/* ADDED */
api.interceptors.request.use((config) => {
  /* ADDED */
  const token =
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("viptaksi-admin-token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
