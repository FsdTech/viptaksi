/* ADDED */
import { useTranslation } from "react-i18next";
import { Mail, Phone } from "lucide-react";
/* ADDED */
import type { Dispatch, SetStateAction } from "react";

/* ADDED */
type SettingsForm = {
  site_name: string;
  support_email: string;
  phone: string;
  currency: string;
  maintenance_mode: boolean;
};

/* ADDED */
export default function GeneralSettings({
  form,
  setForm,
  readOnly = false,
}: {
  form: SettingsForm;
  setForm: Dispatch<SetStateAction<SettingsForm>>;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 shadow-[0_0_24px_rgba(245,183,0,0.06)]">
      <h3 className="text-lg font-semibold text-white mb-6 border-b border-[#262626] pb-3">{t("genel.title")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">{t("genel.siteTitle")}</label>
          <input
            type="text"
            value={form.site_name}
            onChange={(e) => setForm((prev) => ({ ...prev, site_name: e.target.value }))}
            disabled={readOnly}
            className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white focus:border-[#f5b700] outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">{t("genel.supportEmail")}</label>
          <div className="flex items-center bg-black border border-[#262626] rounded-xl px-4 py-3 group focus-within:border-[#f5b700] transition-all">
            <Mail size={16} className="text-gray-500 mr-3" />
            <input
              type="email"
              value={form.support_email}
              onChange={(e) => setForm((prev) => ({ ...prev, support_email: e.target.value }))}
              disabled={readOnly}
              className="w-full bg-transparent text-white outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">{t("genel.phone")}</label>
          <div className="flex items-center bg-black border border-[#262626] rounded-xl px-4 py-3 focus-within:border-[#f5b700] transition-all">
            <Phone size={16} className="text-gray-500 mr-3" />
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={readOnly}
              className="w-full bg-transparent text-white outline-none"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-gray-400">{t("genel.currency")}</label>
          <select
            value={form.currency}
            onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
            disabled={readOnly}
            className="w-full bg-black border border-[#262626] rounded-xl px-4 py-3 text-white outline-none focus:border-[#f5b700]"
          >
            <option value="TRY">{t("genel.try")}</option>
            <option value="USD">{t("genel.usd")}</option>
            <option value="EUR">{t("genel.eur")}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
