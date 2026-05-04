import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import AdminI18nSync from "@/components/AdminI18nSync.tsx";
import { AuthProvider } from "@/store/AuthContext.tsx";
import { AppRoutes } from "@/router/index.tsx";
import { useAdminSettings } from "@/hooks/useAdminSettings.ts";

/* KAPATILDI - 2026-04-04 — rota tanımları ./router/index.tsx içine taşındı */
/*
import AdminLayout from "./layout/AdminLayout";
import { Routes, Route, Navigate } from "react-router-dom";
...
function AppRoutes() { ... }
*/

function App() {
  const settings = useAdminSettings();

  useEffect(() => {
    document.title = settings.site_name || "VipStar Taksi";
  }, [settings.site_name]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AdminI18nSync />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
