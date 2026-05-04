import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type PublicLangResponse = { default_language?: string };

function getApiOrigin(): string {
  if (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, "");
  }
  return "http://localhost:4000";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const base = getApiOrigin();
    const publicLangUrl = base ? `${base}/api/public/language` : "/api/public/language";

    fetch(publicLangUrl, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: PublicLangResponse) => {
        if (cancelled) return;
        const lng = data?.default_language === "en" ? "en" : "tr";
        void i18n.changeLanguage(lng);
        document.documentElement.lang = lng;
        document.documentElement.setAttribute("data-lang", lng);
        setLangReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          void i18n.changeLanguage("tr");
          document.documentElement.lang = "tr";
          setLangReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [i18n]);

  useEffect(() => {
    if (!langReady) return;
    let cancelled = false;
    const base = getApiOrigin();
    const lng = i18n.language === "en" ? "en" : "tr";
    const landingUrl = base
      ? `${base}/api/landing?lang=${lng}&ts=${Date.now()}`
      : `/api/landing?lang=${lng}&ts=${Date.now()}`;

    setLoading(true);
    setError("");

    fetch(landingUrl, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { content?: string }) => {
        if (!cancelled) setHtml(data?.content || "");
      })
      .catch((err) => {
        console.error("Landing fetch error:", err);
        if (!cancelled) setError(i18n.t("errorLoad"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [langReady, i18n.language]);

  if (!langReady || loading) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>{t("loading")}</div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 24, color: "#ef4444", fontFamily: "system-ui, sans-serif" }}>
        {error}
      </div>
    );
  }
  if (!html.trim()) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>{t("emptyLanding")}</div>
    );
  }

  return (
    <iframe
      title="VipStar Landing"
      srcDoc={html}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
    />
  );
}
