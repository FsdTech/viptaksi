import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import { dispatchAdminLocaleRefresh } from "@/components/AdminI18nSync.tsx";

const SUPPORTED_CODES = ["tr", "en"] as const;

export default function LanguageSettings({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const [defaultLanguage, setDefaultLanguage] = useState<"tr" | "en">("tr");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/settings/language");
        if (res.data?.default_language) {
          const d = String(res.data.default_language).toLowerCase();
          setDefaultLanguage(d === "en" ? "en" : "tr");
        } else {
          setDefaultLanguage("tr");
        }
      } catch (err) {
        console.error("Language settings load error:", err);
        setError(t("dil.loadError"));
        setDefaultLanguage("tr");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t]);

  const onSave = async () => {
    if (readOnly) return;
    try {
      setSaving(true);
      setError(null);
      setSavedOk(false);
      await api.post("/settings/language", {
        default_language: defaultLanguage,
        supported_languages: ["tr", "en"],
      });
      setSavedOk(true);
      dispatchAdminLocaleRefresh();
      window.setTimeout(() => setSavedOk(false), 2500);
    } catch (err) {
      console.error("Language settings save error:", err);
      setError(t("dil.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)] space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#262626] pb-3">
        {t("dil.title")}
      </h3>
      <p className="text-xs text-gray-500">
        {t("dil.intro")}
      </p>
      {loading ? <p className="text-xs text-gray-500">{t("common.loading")}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {savedOk ? <p className="text-xs text-green-400">{t("common.saved")}</p> : null}

      <div className="space-y-2">
        <p className="text-sm text-gray-400">{t("dil.supportedTitle")}</p>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_CODES.map((code) => (
            <span
              key={code}
              className="inline-flex items-center rounded-lg border border-[#f5b700]/40 bg-[#f5b700]/10 px-3 py-1.5 text-sm font-medium text-[#f5b700]"
            >
              {code === "tr" ? t("dil.trShort") : t("dil.en")}
              <span className="ml-2 text-xs text-gray-400">{t("dil.langActiveBadge", { state: t("common.active") })}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-400">
          {t("dil.defaultTitle")}
        </label>
        <select
          value={defaultLanguage}
          onChange={(e) => setDefaultLanguage(e.target.value === "en" ? "en" : "tr")}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
        >
          <option value="tr">{t("dil.trDefault")}</option>
          <option value="en">{t("dil.en")}</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving || readOnly}
        className="bg-[#f5b700] text-black px-4 py-2 rounded-xl font-bold hover:bg-[#eab308] transition-all disabled:opacity-60"
      >
        {saving ? t("common.saving") : t("common.save")}
      </button>
    </div>
  );
}
