import { useEffect, useState } from "react";
import { api } from "@/services/api.ts";

export type AdminSettings = {
  site_name: string;
  support_email: string;
  phone: string;
  currency: "TRY" | "USD" | "EUR" | string;
};

const STORAGE_KEY = "viptaksi-admin-settings-cache";

function readCached(): AdminSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        site_name: "VipStar Taksi",
        support_email: "destek@vipstar.com",
        phone: "+90 5XX XXX XX XX",
        currency: "TRY",
      };
    }
    const parsed = JSON.parse(raw) as Partial<AdminSettings>;
    return {
      site_name: parsed.site_name || "VipStar Taksi",
      support_email: parsed.support_email || "destek@vipstar.com",
      phone: parsed.phone || "+90 5XX XXX XX XX",
      currency: parsed.currency || "TRY",
    };
  } catch {
    return {
      site_name: "VipStar Taksi",
      support_email: "destek@vipstar.com",
      phone: "+90 5XX XXX XX XX",
      currency: "TRY",
    };
  }
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() => readCached());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get<Partial<AdminSettings>>("/settings");
        if (cancelled || !res.data) return;
        const next: AdminSettings = {
          site_name: res.data.site_name || "VipStar Taksi",
          support_email: res.data.support_email || "destek@vipstar.com",
          phone: res.data.phone || "+90 5XX XXX XX XX",
          currency: res.data.currency || "TRY",
        };
        setSettings(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // keep cached/default values
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}
