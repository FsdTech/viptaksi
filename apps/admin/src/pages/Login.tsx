/* EKLENDİ */
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/store/AuthContext.tsx";
import { useAdminSettings } from "@/hooks/useAdminSettings.ts";

/* EKLENDİ */
export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const settings = useAdminSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* EKLENDİ */
  const [busy, setBusy] = useState(false);

  /* ADDED */
  const handleLogin = async () => {
    const ok = await login(email, password);
    if (ok) {
      window.location.href = "/";
      return true;
    }
    return false;
  };

  /* EKLENDİ */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      /* ADDED */
      const ok = await handleLogin();
      if (!ok) {
        setError(t("login.errorInvalid"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <h1 className="text-[#f5b700] font-bold text-xl sm:text-2xl tracking-wide text-center">
            🚕 {settings.site_name || t("login.brand")}
          </h1>
        </div>

        <div
          className="rounded-2xl border border-[#2a2a2a] bg-[#141414] p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]"
        >
          <h1 className="text-white text-xl font-bold text-center mb-2">
            {t("login.title")}
          </h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            {t("login.subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {t("login.email")}
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] text-white px-4 py-3 outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30 transition"
                placeholder="admin@vipstar.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {t("login.password")}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] text-white px-4 py-3 outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/30 transition"
                placeholder="••••••"
              />
            </div>

            {error ? (
              <p className="text-red-400 text-sm font-medium text-center bg-red-500/10 border border-red-500/20 rounded-2xl py-2 px-3">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-yellow-400 text-black font-bold py-3.5 transition hover:shadow-[0_0_20px_rgba(250,204,21,0.4)] active:scale-[0.99] disabled:opacity-60"
            >
              {/* EKLENDİ */}
              {busy ? t("login.signingIn") : t("login.signIn")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
