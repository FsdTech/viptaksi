import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@/i18n/config.ts'
import App from '@/App.tsx'
import "leaflet/dist/leaflet.css";

/* EKLENDİ — AuthProvider, BillingSync ve yönlendirme App bileşeninde birleştirilir */
/* ADDED */
const __originalFetch = window.fetch.bind(window);
/* ADDED */
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = window.localStorage.getItem("viptaksi-admin-token");
  const apiBase = import.meta.env.VITE_API_URL;
  const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (token && apiBase && requestUrl.startsWith(apiBase)) {
    const headers = new Headers(init?.headers ?? {});
    headers.set("Authorization", `Bearer ${token}`);
    return __originalFetch(input, { ...init, headers });
  }
  return __originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
