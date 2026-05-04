import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { api } from "@/services/api.ts";

const GATEWAY_ORDER = [
  "iban",
  "midtrans",
  "xendit",
  "paypal",
  "paystack",
  "razorpay",
  "stripe",
  "mercado_pago",
] as const;

type GatewayCode = (typeof GATEWAY_ORDER)[number];

type GatewayRow = {
  code: GatewayCode;
  displayName: string;
  enabled: boolean;
  config: Record<string, string>;
};

const DEFAULT_LABELS: Record<GatewayCode, string> = {
  iban: "IBAN",
  midtrans: "Midtrans",
  xendit: "Xendit",
  paypal: "Paypal",
  paystack: "PayStack",
  razorpay: "Razorpay",
  stripe: "Stripe",
  mercado_pago: "Mercado Pago",
};

type FieldSpec = { key: string; label: string; secret?: boolean; placeholder?: string };

const FIELD_DEFS: Partial<Record<GatewayCode, FieldSpec[]>> = {
  midtrans: [
    { key: "merchantId", label: "Midtrans Merchant Id", secret: true },
    { key: "clientKey", label: "Midtrans Client Key", secret: true },
    { key: "secretKey", label: "Midtrans Secret Key", secret: true },
  ],
  xendit: [{ key: "secretKey", label: "Xendit Secret Key", secret: true }],
  paypal: [
    { key: "clientId", label: "Paypal Client Id", secret: true },
    { key: "secretId", label: "Paypal Secret Id", secret: true },
  ],
  paystack: [
    { key: "key", label: "PayStack Key", secret: true },
    {
      key: "callbackUrl",
      label: "PayStack Callback Url",
      placeholder: "Enter PayStack Callback Url",
    },
  ],
  razorpay: [
    { key: "clientKey", label: "Razorpay Client Key", secret: true },
    { key: "secretId", label: "Razorpay Secret Id", secret: true },
  ],
  stripe: [
    { key: "publishableKey", label: "Stripe Client Publishable Key", secret: true },
    { key: "secretKey", label: "Stripe Secret Key", secret: true },
  ],
  mercado_pago: [
    { key: "accessToken", label: "Mercado Pago Access Token", secret: true },
    {
      key: "callbackUrl",
      label: "Mercado Pago Callback Url",
      placeholder: "Enter Mercado Pago Callback Url",
    },
  ],
};

function emptyConfigFor(code: GatewayCode): Record<string, string> {
  const fields = FIELD_DEFS[code];
  if (!fields) return {};
  return Object.fromEntries(fields.map((f) => [f.key, ""]));
}

function buildDefaultGateways(): GatewayRow[] {
  return GATEWAY_ORDER.map((code) => ({
    code,
    displayName: DEFAULT_LABELS[code],
    enabled: false,
    config: emptyConfigFor(code),
  }));
}

function parseGateway(raw: { code?: string; displayName?: string; display_name?: string; enabled?: boolean; config?: unknown }): GatewayRow | null {
  const code = raw.code as GatewayCode | undefined;
  if (!code || !GATEWAY_ORDER.includes(code as GatewayCode)) return null;
  const base = emptyConfigFor(code);
  const cfgIn = raw.config && typeof raw.config === "object" && !Array.isArray(raw.config) ? (raw.config as Record<string, unknown>) : {};
  const config = { ...base };
  for (const k of Object.keys(base)) {
    config[k] = String(cfgIn[k] ?? "");
  }
  return {
    code,
    displayName: String(raw.displayName ?? raw.display_name ?? DEFAULT_LABELS[code] ?? code),
    enabled: Boolean(raw.enabled),
    config,
  };
}

function mergeGatewaysFromApi(rows: unknown[]): GatewayRow[] {
  const map = new Map<GatewayCode, GatewayRow>();
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const g = parseGateway(r as Parameters<typeof parseGateway>[0]);
    if (g) map.set(g.code, g);
  }
  return GATEWAY_ORDER.map((code) => {
    const g = map.get(code);
    if (g) return g;
    return {
      code,
      displayName: DEFAULT_LABELS[code],
      enabled: false,
      config: emptyConfigFor(code),
    };
  });
}

export default function PaymentMethods({ readOnly = false }: { readOnly?: boolean }) {
  const { t } = useTranslation();
  const [gateways, setGateways] = useState<GatewayRow[]>(() => buildDefaultGateways());
  const [openByCode, setOpenByCode] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    for (const c of GATEWAY_ORDER) {
      if (c !== "iban") o[c] = true;
    }
    return o;
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ibanRow = gateways.find((g) => g.code === "iban");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/settings/payment");
        const list = Array.isArray(res.data?.gateways) ? res.data.gateways : [];
        setGateways(mergeGatewaysFromApi(list));
      } catch (err) {
        console.error("Payment settings load error:", err);
        setError(t("payment.loadError"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t]);

  const patchGateway = (code: GatewayCode, patch: Partial<Pick<GatewayRow, "displayName" | "enabled">>) => {
    setGateways((prev) => prev.map((g) => (g.code === code ? { ...g, ...patch } : g)));
  };

  const patchConfig = (code: GatewayCode, key: string, value: string) => {
    setGateways((prev) =>
      prev.map((g) =>
        g.code === code ? { ...g, config: { ...g.config, [key]: value } } : g
      )
    );
  };

  const onSave = async () => {
    if (readOnly) return;
    try {
      setSaving(true);
      setError(null);
      const res = await api.post("/settings/payment", { gateways });
      const list = Array.isArray(res.data?.gateways) ? res.data.gateways : [];
      if (list.length) setGateways(mergeGatewaysFromApi(list));
    } catch (err) {
      console.error("Payment settings save error:", err);
      setError(t("payment.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const nonIban = GATEWAY_ORDER.filter((c) => c !== "iban");

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)] space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#262626] pb-3">
        {t("payment.title")}
      </h3>
      {loading ? <p className="text-xs text-gray-500">{t("common.loading")}</p> : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {/* IBAN — sadece aktif / pasif; IBAN surucu uygulamasinda tanimlanir */}
      <div className="bg-black border border-[#262626] rounded-xl text-gray-300 overflow-hidden">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">IBAN</p>
            <p className="text-xs text-gray-500">
              {t("payment.ibanHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => patchGateway("iban", { enabled: !ibanRow?.enabled })}
            disabled={readOnly}
            className={`relative h-6 w-12 shrink-0 cursor-pointer rounded-full transition-all ${
              ibanRow?.enabled ? "bg-[#f5b700]" : "bg-[#262626]"
            }`}
            aria-label={ibanRow?.enabled ? t("payment.ibanAriaOff") : t("payment.ibanAriaOn")}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
                ibanRow?.enabled ? "left-7 bg-black" : "left-1 bg-gray-500"
              }`}
            />
          </button>
        </div>
      </div>

      {nonIban.map((code) => {
        const g = gateways.find((x) => x.code === code);
        if (!g) return null;
        const fields = FIELD_DEFS[code] ?? [];
        const open = openByCode[code] ?? false;
        return (
          <div
            key={code}
            className="bg-black border border-[#262626] rounded-xl text-gray-300 overflow-hidden"
          >
            <div
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 ${
                open ? "border-b border-[#262626]" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenByCode((prev) => ({ ...prev, [code]: !prev[code] }))}
                className="flex min-w-0 flex-1 items-center gap-2 text-left hover:opacity-90"
              >
                <span className="text-sm font-semibold text-white truncate">{g.displayName}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={() => patchGateway(code, { enabled: !g.enabled })}
                disabled={readOnly}
                className={`relative h-6 w-12 shrink-0 cursor-pointer rounded-full transition-all ${
                  g.enabled ? "bg-[#f5b700]" : "bg-[#262626]"
                }`}
                aria-label={g.enabled ? t("common.close") : t("common.open")}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
                    g.enabled ? "left-7 bg-black" : "left-1 bg-gray-500"
                  }`}
                />
              </button>
            </div>
            {open ? (
              <div className="px-4 pb-4 pt-2 space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs text-gray-400">{t("payment.displayName")}</span>
                  <input
                    type="text"
                    value={g.displayName}
                    onChange={(e) => patchGateway(code, { displayName: e.target.value })}
                    disabled={readOnly}
                    className="w-full rounded-xl bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#f5b700]"
                    placeholder={DEFAULT_LABELS[code]}
                  />
                </label>
                {fields.map((f) => (
                  <label key={f.key} className="block space-y-1">
                    <span className="text-xs text-gray-400">{f.label}</span>
                    <input
                      type={f.secret ? "password" : "text"}
                      value={g.config[f.key] ?? ""}
                      onChange={(e) => patchConfig(code, f.key, e.target.value)}
                      disabled={readOnly}
                      className="w-full rounded-xl bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#f5b700]"
                      placeholder={f.placeholder ?? ""}
                      autoComplete={f.secret ? "new-password" : "off"}
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

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
