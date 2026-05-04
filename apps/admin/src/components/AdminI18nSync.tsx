import { useEffect } from "react";
import i18n from "@/i18n/config";
import { getApiBaseUrl } from "@/services/api.ts";

const LOCALE_EVENT = "viptaksi-admin-locale";

export function dispatchAdminLocaleRefresh() {
  window.dispatchEvent(new Event(LOCALE_EVENT));
}

type PublicLangResponse = { default_language?: string };

export default function AdminI18nSync() {
  useEffect(() => {
    const apply = async () => {
      const base = getApiBaseUrl().replace(/\/$/, "");
      const url = base ? `${base}/api/public/language` : "/api/public/language";
      try {
        const res = await fetch(url, { cache: "no-store" });
        const data: PublicLangResponse = res.ok ? await res.json() : {};
        const lng = data?.default_language === "en" ? "en" : "tr";
        await i18n.changeLanguage(lng);
        document.documentElement.lang = lng;
        document.documentElement.setAttribute("data-admin-lang", lng);
      } catch {
        await i18n.changeLanguage("tr");
        document.documentElement.lang = "tr";
      }
    };

    void apply();
    window.addEventListener(LOCALE_EVENT, apply);
    return () => window.removeEventListener(LOCALE_EVENT, apply);
  }, []);

  return null;
}
