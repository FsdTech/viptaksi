/* ADDED */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
/* ADDED */
import { api } from "@/services/api.ts";

/* ADDED */
type SmtpSettings = {
  host: string;
  port: string;
  user: string;
  password: string;
};

/* ADDED */
export default function SmtpSettings({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SmtpSettings>({
    host: "smtp.gmail.com",
    port: "587",
    user: "admin@vipstar.com",
    password: "YOUR_GMAIL_APP_PASSWORD",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/settings/smtp");
        if (res.data) {
          setForm({
            host: res.data.host ?? "",
            port: String(res.data.port ?? ""),
            user: res.data.user_name ?? "",
            password: res.data.password ?? "",
          });
        }
      } catch (err) {
        console.error("SMTP settings load error:", err);
        setError(t("smtp.loadError"));
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
      await api.post("/settings/smtp", {
        host: form.host,
        port: Number(form.port) || 0,
        user: form.user,
        password: form.password,
      });
    } catch (err) {
      console.error("SMTP settings save error:", err);
      setError(t("smtp.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)] space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#262626] pb-3">
        {t("smtp.title")}
      </h3>
      {loading ? <p className="text-xs text-gray-500">{t("common.loading")}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={form.host}
          onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("smtp.host")}
        />
        <input
          value={form.port}
          onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("smtp.port")}
        />
        <input
          value={form.user}
          onChange={(e) => setForm((p) => ({ ...p, user: e.target.value }))}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("smtp.user")}
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          disabled={readOnly}
          className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          placeholder={t("smtp.password")}
        />
      </div>
      <button
        onClick={onSave}
        disabled={saving || readOnly}
        className="bg-[#f5b700] text-black px-4 py-2 rounded-xl font-bold hover:bg-[#eab308] transition-all disabled:opacity-60"
      >
        {saving ? t("common.saving") : t("common.save")}
      </button>
    </div>
  );
}
