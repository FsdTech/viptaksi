import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Save, Globe, Palette, Smartphone, Mail, Phone } from "lucide-react";
/* ADDED */
import { api } from "@/services/api.ts";
/* ADDED */
import { Card } from "@/components/ui/Card.tsx";
/* ADDED */
import GeneralSettings from "@/pages/settings/GeneralSettings.tsx";
/* ADDED */
import MapSettings from "@/pages/settings/MapSettings.tsx";
/* ADDED */
import SmtpSettings from "@/pages/settings/SmtpSettings.tsx";
/* ADDED */
import PaymentMethods from "@/pages/settings/PaymentMethods.tsx";
/* ADDED */
import LanguageSettings from "@/pages/settings/LanguageSettings.tsx";
import { useAuth } from "@/store/AuthContext.tsx";

/* EKLENDİ */
type SettingsForm = {
  site_name: string;
  support_email: string;
  phone: string;
  currency: string;
  maintenance_mode: boolean;
};

/* ADDED */
function CardHeader({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#262626] pb-3">{children}</h3>;
}

/* ADDED */
function CardContent({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function LandingHtmlEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const syncingRef = useRef(false);
  const [sourceMode, setSourceMode] = useState(true);
  const [fontName, setFontName] = useState("Arial");
  const [fontSize, setFontSize] = useState("3");
  const [textColor, setTextColor] = useState("#111111");

  useEffect(() => {
    if (sourceMode || readOnly) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const current = doc.documentElement?.outerHTML ?? "";
    if (current !== value && !syncingRef.current) {
      doc.open();
      doc.write(value || "<!doctype html><html><head></head><body></body></html>");
      doc.close();
      try {
        doc.designMode = "on";
      } catch (_error) {
        // ignore
      }
    }
  }, [value, sourceMode]);

  const bindVisualEditing = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    try {
      doc.designMode = "on";
    } catch (_error) {
      // ignore
    }
    const emit = () => {
      syncingRef.current = true;
      onChange(doc.documentElement?.outerHTML ?? "");
      window.setTimeout(() => {
        syncingRef.current = false;
      }, 0);
    };
    doc.addEventListener("input", emit);
    doc.addEventListener("keyup", emit);
    doc.addEventListener("paste", () => window.setTimeout(emit, 0));
  };

  const run = (command: string, valueArg?: string) => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || sourceMode || readOnly) return;
    doc.execCommand(command, false, valueArg);
    onChange(doc.documentElement?.outerHTML ?? value);
  };

  const applyFontName = (nextFont: string) => {
    setFontName(nextFont);
    run("fontName", nextFont);
  };

  const applyFontSize = (nextSize: string) => {
    setFontSize(nextSize);
    run("fontSize", nextSize);
  };

  const applyTextColor = (nextColor: string) => {
    setTextColor(nextColor);
    run("foreColor", nextColor);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#111]">
      <div className="flex flex-wrap gap-2 p-2 border-b border-[#2a2a2a] bg-[#161616]">
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded ${sourceMode ? "bg-[#f5b700] text-black" : "bg-[#222] text-white"}`}
          onClick={() => setSourceMode(true)}
          disabled={readOnly}
        >
          {t("settings.editorSource")}
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded ${!sourceMode ? "bg-[#f5b700] text-black" : "bg-[#222] text-white"}`}
          onClick={() => setSourceMode(false)}
          disabled={readOnly}
        >
          {t("settings.editorVisual")}
        </button>
        <button type="button" disabled={readOnly} className="px-2 py-1 text-xs bg-[#222] rounded text-white disabled:opacity-50" onClick={() => run("bold")}>{t("settings.editorBold")}</button>
        <button type="button" disabled={readOnly} className="px-2 py-1 text-xs bg-[#222] rounded text-white disabled:opacity-50" onClick={() => run("italic")}>{t("settings.editorItalic")}</button>
        <button type="button" disabled={readOnly} className="px-2 py-1 text-xs bg-[#222] rounded text-white disabled:opacity-50" onClick={() => run("underline")}>{t("settings.editorUnderline")}</button>
        <button type="button" disabled={readOnly} className="px-2 py-1 text-xs bg-[#222] rounded text-white disabled:opacity-50" onClick={() => run("insertUnorderedList")}>{t("settings.editorList")}</button>
        <button type="button" disabled={readOnly} className="px-2 py-1 text-xs bg-[#222] rounded text-white disabled:opacity-50" onClick={() => run("formatBlock", "h2")}>H2</button>
        <select
          value={fontName}
          onChange={(e) => applyFontName(e.target.value)}
          disabled={readOnly}
          className="px-2 py-1 text-xs rounded bg-[#222] text-white border border-[#333]"
        >
          <option value="Arial">Arial</option>
          <option value="Inter">Inter</option>
          <option value="Helvetica">Helvetica</option>
          <option value="'Times New Roman'">Times</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="'Courier New'">Courier</option>
        </select>
        <select
          value={fontSize}
          onChange={(e) => applyFontSize(e.target.value)}
          disabled={readOnly}
          className="px-2 py-1 text-xs rounded bg-[#222] text-white border border-[#333]"
        >
          <option value="1">10px</option>
          <option value="2">13px</option>
          <option value="3">16px</option>
          <option value="4">18px</option>
          <option value="5">24px</option>
          <option value="6">32px</option>
          <option value="7">48px</option>
        </select>
        <label className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#222] text-white border border-[#333]">
          {t("settings.editorColor")}
          <input
            type="color"
            value={textColor}
            onChange={(e) => applyTextColor(e.target.value)}
            disabled={readOnly}
            className="h-4 w-6 bg-transparent border-0 p-0"
          />
        </label>
        <button
          type="button"
          disabled={readOnly}
          className="px-2 py-1 text-xs bg-[#222] rounded text-white"
          onClick={() => {
            const url = window.prompt(t("settings.editorLinkPrompt"));
            if (url) run("createLink", url);
          }}
        >
          {t("settings.editorLink")}
        </button>
      </div>
      {sourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className="w-full h-[500px] p-3 bg-[#0f0f0f] text-gray-100 font-mono text-xs outline-none"
        />
      ) : (
        <iframe
          ref={iframeRef}
          srcDoc={value}
          onLoad={bindVisualEditing}
          className="w-full h-[500px] bg-white"
        />
      )}
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  /* EKLENDİ */
  const [loading, setLoading] = useState(false);
  /* EKLENDİ */
  const [saving, setSaving] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const [websiteStatus, setWebsiteStatus] = useState("checking");
  /* EKLENDİ */
  const [form, setForm] = useState<SettingsForm>({
    site_name: "VipStar Taksi",
    support_email: "destek@vipstar.com",
    phone: "+90 5XX XXX XX XX",
    currency: "TRY",
    maintenance_mode: false,
  });
  /* ADDED */
  const [activeTab, setActiveTab] = useState("genel");
  const [html, setHtml] = useState("");
  const [htmlEn, setHtmlEn] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/settings");
        if (cancelled || !res.data) return;
        const data = res.data;
        setForm({
          site_name: data.site_name ?? "",
          support_email: data.support_email ?? "",
          phone: data.phone ?? "",
          currency: data.currency ?? "TRY",
          maintenance_mode: Boolean(data.maintenance_mode),
        });
      } catch (error) {
        console.error("Settings load error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    api
      .get("/api/landing")
      .then((res) => {
        const data = res.data;
        setHtml(data?.content_tr ?? data?.content ?? "");
        setHtmlEn(typeof data?.content_en === "string" ? data.content_en : "");
      })
      .catch((error) => {
        console.error("Landing fetch error:", error);
      });
  }, []);

  useEffect(() => {
    const runHealthChecks = () => {
      fetch("http://localhost:4000/health")
        .then(() => setBackendStatus("online"))
        .catch(() => setBackendStatus("offline"));

      fetch("http://localhost:3000")
        .then(() => setWebsiteStatus("online"))
        .catch(() => setWebsiteStatus("offline"));
    };

    runHealthChecks();
    const interval = window.setInterval(runHealthChecks, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    try {
      setSaving(true);
      const { data } = await api.put("/settings", form);
      if (data) {
        setForm({
          site_name: data.site_name ?? form.site_name,
          support_email: data.support_email ?? form.support_email,
          phone: data.phone ?? form.phone,
          currency: data.currency ?? form.currency,
          maintenance_mode: Boolean(data.maintenance_mode),
        });
      }
    } catch (error) {
      console.error("Settings save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLandingSave = async () => {
    if (!isSuperAdmin) return;
    try {
      setSaving(true);
      await api.post("/api/landing", { content: html, content_en: htmlEn });
      alert(t("common.saved"));
    } catch (error) {
      console.error("Landing save error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("settings.systemTitle")}</h1>
          <p className="text-gray-400 text-sm">{t("settings.platformSubtitle")}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isSuperAdmin}
          className="flex items-center gap-2 bg-[#f5b700] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#eab308] transition-all disabled:opacity-60"
        >
          <Save size={20} /> {saving ? t("settings.savingSettings") : t("settings.saveSettings")}
        </button>
      </div>
      {!isSuperAdmin ? (
        <p className="text-xs text-amber-300">{t("settings.readonlyNotice")}</p>
      ) : null}

      <div className="space-y-2">
        {backendStatus === "offline" && (
          <p className="text-sm text-red-400">{t("settings.backendOffline")}</p>
        )}
        {websiteStatus === "offline" && (
          <p className="text-sm text-red-400">{t("settings.websiteOffline")}</p>
        )}
        {backendStatus === "online" && (
          <p className="text-sm text-green-400">{t("settings.backendOnline")}</p>
        )}
        {websiteStatus === "online" && (
          <p className="text-sm text-green-400">{t("settings.websiteOnline")}</p>
        )}
      </div>

      {/* EKLENDİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* SOL MENÜ - KATEGORİLER */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab("genel")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === "genel"
                ? "bg-[#f5b700] text-black font-semibold shadow-lg shadow-[#f5b700]/10 border-[#f5b700]"
                : "bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] border-[#262626]"
            }`}
          >
            <Globe size={18} /> {t("settings.tabGeneral")}
          </button>
          {/* REMOVED */}
          <button className="hidden w-full items-center gap-3 px-4 py-3 rounded-xl bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] transition-all border border-[#262626]">
            <Palette size={18} /> Gorunum & Tema
          </button>
          {/* REMOVED */}
          <button className="hidden w-full items-center gap-3 px-4 py-3 rounded-xl bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] transition-all border border-[#262626]">
            <Smartphone size={18} /> Mobil Uygulama
          </button>
          <button
            onClick={() => setActiveTab("harita")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === "harita"
                ? "bg-[#f5b700] text-black font-semibold shadow-lg shadow-[#f5b700]/10 border-[#f5b700]"
                : "bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] border-[#262626]"
            }`}
          >
            <Palette size={18} /> {t("settings.tabMap")}
          </button>
          <button
            onClick={() => setActiveTab("smtp")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === "smtp"
                ? "bg-[#f5b700] text-black font-semibold shadow-lg shadow-[#f5b700]/10 border-[#f5b700]"
                : "bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] border-[#262626]"
            }`}
          >
            <Mail size={18} /> {t("settings.tabSmtp")}
          </button>
          <button
            onClick={() => setActiveTab("landing")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === "landing"
                ? "bg-[#f5b700] text-black font-semibold shadow-lg shadow-[#f5b700]/10 border-[#f5b700]"
                : "bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] border-[#262626]"
            }`}
          >
            <Smartphone size={18} /> {t("settings.tabLanding")}
          </button>
          <button
            onClick={() => setActiveTab("odeme")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === "odeme"
                ? "bg-[#f5b700] text-black font-semibold shadow-lg shadow-[#f5b700]/10 border-[#f5b700]"
                : "bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] border-[#262626]"
            }`}
          >
            <Phone size={18} /> {t("settings.tabPayments")}
          </button>
          <button
            onClick={() => setActiveTab("dil")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
              activeTab === "dil"
                ? "bg-[#f5b700] text-black font-semibold shadow-lg shadow-[#f5b700]/10 border-[#f5b700]"
                : "bg-[#161616] text-gray-400 hover:bg-[#1c1c1c] border-[#262626]"
            }`}
          >
            <Globe size={18} /> {t("settings.tabLanguage")}
          </button>
        </div>

        {/* SAĞ TARAF - FORM ALANI */}
        <div className="lg:col-span-3 space-y-6">
          {/* REMOVED */}
          <div className="hidden bg-[#161616] border border-[#262626] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 border-b border-[#262626] pb-3">Platform Bilgileri</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Site Basligi</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.site_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, site_name: e.target.value }))}
                    className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-[#f5b700] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Destek E-posta</label>
                <div className="flex items-center bg-black border border-[#262626] rounded-xl px-4 py-3 group focus-within:border-[#f5b700] transition-all">
                  <Mail size={16} className="text-gray-500 mr-3" />
                  <input
                    type="email"
                    value={form.support_email}
                    onChange={(e) => setForm((prev) => ({ ...prev, support_email: e.target.value }))}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Iletisim Hatti</label>
                <div className="flex items-center bg-black border border-[#262626] rounded-xl px-4 py-3 focus-within:border-[#f5b700] transition-all">
                  <Phone size={16} className="text-gray-500 mr-3" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-transparent text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Para Birimi</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
                >
                  <option value="TRY">TRY - Turk Lirasi (TL)</option>
                  <option value="USD">USD - Amerikan Dolari ($)</option>
                  <option value="EUR">EUR - Euro (EUR)</option>
                </select>
              </div>
            </div>
          </div>

          {/* REMOVED */}
          <div className="hidden bg-[#161616] border border-[#262626] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 border-b border-[#262626] pb-3">Sistem Durumu</h3>
            <div className="flex items-center justify-between p-4 bg-black/50 border border-[#262626] rounded-xl">
              <div>
                <p className="text-white font-medium">Bakim Modu</p>
                <p className="text-xs text-gray-500">Aktif edildiginde sadece yoneticiler giris yapabilir.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))
                }
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${
                  form.maintenance_mode ? "bg-[#f5b700]" : "bg-[#262626]"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                    form.maintenance_mode ? "left-7 bg-black" : "left-1 bg-gray-500"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ADDED */}
          {activeTab === "genel" && <GeneralSettings form={form} setForm={setForm} readOnly={!isSuperAdmin} />}
          {/* ADDED */}
          {activeTab === "harita" && <MapSettings readOnly={!isSuperAdmin} />}
          {/* ADDED */}
          {activeTab === "smtp" && <SmtpSettings readOnly={!isSuperAdmin} />}
          {/* ADDED */}
          {activeTab === "landing" && (
            <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)] space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#262626] pb-3">
                {t("settings.landingTitle")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("settings.landingIntro")}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <p className="text-sm text-gray-400 mb-2">{t("settings.landingTr")}</p>
                  <LandingHtmlEditor value={html} onChange={setHtml} readOnly={!isSuperAdmin} />
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">{t("settings.landingPreviewTr")}</p>
                  <iframe
                    title="Landing preview TR"
                    srcDoc={html}
                    style={{
                      width: "100%",
                      height: "500px",
                      border: "1px solid #333",
                      background: "#000",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">{t("settings.landingEn")}</p>
                <textarea
                  value={htmlEn}
                  onChange={(e) => setHtmlEn(e.target.value)}
                  readOnly={!isSuperAdmin}
                  className="w-full h-[280px] p-3 bg-[#0f0f0f] text-gray-100 font-mono text-xs outline-none rounded-xl border border-[#262626] focus:border-[#f5b700]"
                  placeholder={t("settings.landingEnPlaceholder")}
                  spellCheck={false}
                />
              </div>

              <button
                type="button"
                className="px-4 py-2 bg-[#f5b700] text-black rounded-xl font-bold hover:bg-[#eab308]"
                onClick={handleLandingSave}
                disabled={!isSuperAdmin}
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          )}
          {/* ADDED */}
          {activeTab === "odeme" && <PaymentMethods readOnly={!isSuperAdmin} />}
          {/* ADDED */}
          {activeTab === "dil" && <LanguageSettings readOnly={!isSuperAdmin} />}

          {/* ADDED */}
          <Card className="hidden bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)]">
            <CardHeader>Map Settings</CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]" placeholder="Google Maps API Key" />
                <input className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]" placeholder="Default Latitude,Longitude" />
              </div>
            </CardContent>
          </Card>

          {/* ADDED */}
          <Card className="hidden bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)]">
            <CardHeader>SMTP Settings</CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]" placeholder="SMTP Host" />
                <input className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]" placeholder="SMTP Port" />
                <input className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]" placeholder="SMTP Username" />
                <input className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]" placeholder="SMTP Password" type="password" />
              </div>
            </CardContent>
          </Card>

          {/* ADDED */}
          <Card className="hidden bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)]">
            <CardHeader>Payment Methods</CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" defaultChecked /> Cash</label>
                <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" defaultChecked /> Card</label>
                <label className="flex items-center gap-2 text-gray-300"><input type="checkbox" /> Wallet</label>
              </div>
            </CardContent>
          </Card>

          {/* ADDED */}
          <Card className="hidden bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)]">
            <CardHeader>Language Management</CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]">
                  <option>Default: Turkish</option>
                  <option>English</option>
                </select>
                <input className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]" placeholder="Add new locale (e.g. de-DE)" />
              </div>
            </CardContent>
          </Card>
          {loading ? <p className="text-xs text-gray-500">{t("settings.dataLoading")}</p> : null}
        </div>
      </div>
    </div>
  );
}