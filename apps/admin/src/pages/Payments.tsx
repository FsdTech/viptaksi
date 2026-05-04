import { useEffect, useState } from "react";
import {
  Check,
  X,
  Eye,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  ShieldX,
  Clock3,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import { useAdminSettings } from "@/hooks/useAdminSettings.ts";
import { useAuth } from "@/store/AuthContext.tsx";

type PaymentStatus = "pending" | "approved" | "rejected";
type DriverAccess = "pending" | "active" | "expired" | "passive";
type PaymentRow = {
  id: string;
  name: string;
  plan: "Haftalık" | "Aylık";
  amount: number;
  status: PaymentStatus;
  receipt: string;
  approvedAt: Date | null;
  expireAt: Date | null;
};

type ApiPayment = {
  id: string;
  amount: number;
  status: PaymentStatus;
  expireAt: string | null;
  createdAt: string | null;
  planType?: "weekly" | "monthly" | null;
  receiptUrl?: string | null;
  driver?: { name?: string | null };
};

/* FORMAT */
function formatCurrency(amount: number, isEn: boolean, currency: string) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
  return amount.toLocaleString(isEn ? "en-US" : "tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ` ${symbol}`;
}

function formatDateTR(date: Date | null, isEn: boolean) {
  if (!date) return "-";
  return date.toLocaleDateString(isEn ? "en-US" : "tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDriverAccess(payment: PaymentRow) {
  if (payment.status === "approved" && payment.expireAt) {
    const now = new Date();
    return payment.expireAt > now ? "active" : "expired";
  }

  if (payment.status === "pending") return "pending";
  return "passive";
}

/* EKLENDİ: COUNTDOWN */
function getRemainingTime(expireAt: Date | null, nowMs: number, isEn: boolean) {
  if (!expireAt) return null;

  const diff = new Date(expireAt).getTime() - nowMs;

  if (diff <= 0) return isEn ? "Expired" : "Süresi Doldu";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return isEn ? `${days}d ${hours}h ${minutes}m` : `${days}g ${hours}s ${minutes}dk`;
  if (hours > 0) return isEn ? `${hours}h ${minutes}m` : `${hours}s ${minutes}dk`;
  return isEn ? `${minutes}m` : `${minutes}dk`;
}

function mapApiPayment(p: ApiPayment): PaymentRow {
  return {
    id: p.id,
    name: p.driver?.name ?? "Driver",
    plan: p.planType === "weekly" ? "Haftalık" : "Aylık",
    amount: Number(p.amount ?? 0),
    status: p.status,
    receipt: p.receiptUrl ?? "",
    approvedAt: p.createdAt ? new Date(p.createdAt) : null,
    expireAt: p.expireAt ? new Date(p.expireAt) : null,
  };
}

export default function Payments() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const settings = useAdminSettings();
  const { user: currentUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  /* EKLENDİ: CANLI COUNTDOWN TETİKLEYİCİ */
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ payments: ApiPayment[] }>("/payments");
        setPayments((res.data?.payments ?? []).map(mapApiPayment));
      } catch (error) {
        console.error("Payments load error:", error);
      }
    };
    void load();
    const interval = window.setInterval(load, 15000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedReceipt(null);
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  /* EKLENDİ: COUNTDOWN YENİLEME */
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTick(Date.now());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const getDemoExpireAt = (plan: "Haftalık" | "Aylık") => {
    const daysToAdd = plan === "Haftalık" ? 7 : 30;
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date;
  };

  const approvePayment = async (paymentId: string) => {
    console.log("APPROVE FUNCTION RUNNING");
    console.log("APPROVE CLICKED", paymentId);
    if (currentUser?.email === "demo@user.com") {
      console.log("DEMO APPROVE");
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                status: "approved",
                approvedAt: new Date(),
                expireAt: getDemoExpireAt(p.plan),
              }
            : p
        )
      );
      alert("Demo: Payment approved");
      return;
    }
    await api.post("/payments/approve", { payment_id: paymentId });
    const res = await api.get<{ payments: ApiPayment[] }>("/payments");
    setPayments((res.data?.payments ?? []).map(mapApiPayment));
  };

  const rejectPayment = async (paymentId: string) => {
    console.log("REJECT CLICKED", paymentId);
    if (currentUser?.email === "demo@user.com") {
      console.log("DEMO REJECT");
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                status: "rejected",
                expireAt: null,
              }
            : p
        )
      );
      alert("Demo: Payment rejected");
      return;
    }
    await api.post("/payments/reject", { payment_id: paymentId });
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: "rejected", expireAt: null } : p)));
  };

  const resetPaymentToPending = async (paymentId: string) => {
    if (currentUser?.email === "demo@user.com") {
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "pending", expireAt: null } : p))
      );
      return;
    }
    await api.post("/payments/reset", { payment_id: paymentId });
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: "pending", expireAt: null } : p)));
  };

  const updatePlan = async (paymentId: string, plan: "Haftalık" | "Aylık") => {
    const amount = plan === "Haftalık" ? 2000 : 6000;
    if (currentUser?.email === "demo@user.com") {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, plan, amount } : p)));
      return;
    }
    await api.post("/payments/update-meta", {
      payment_id: paymentId,
      plan_type: plan === "Haftalık" ? "weekly" : "monthly",
      amount,
    });
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, plan, amount } : p)));
  };

 
  const filtered = payments.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const access = getDriverAccess(p);

    if (filter === "all") return matchSearch;
    if (filter === "pending") return matchSearch && p.status === "pending";
    if (filter === "approved") return matchSearch && p.status === "approved";
    if (filter === "rejected") return matchSearch && p.status === "rejected";
    if (filter === "active") return matchSearch && access === "active";
    if (filter === "expired") return matchSearch && access === "expired";

    return matchSearch;
  });

  const pendingCount = payments.filter((p) => p.status === "pending").length;
  const approvedCount = payments.filter((p) => p.status === "approved").length;
  const rejectedCount = payments.filter((p) => p.status === "rejected").length;
  const activeDriverCount = payments.filter((p) => getDriverAccess(p) === "active").length;

  return (
    /* EKLENDİ */
    <div className="max-w-full lg:max-w-300 mx-auto space-y-10 w-full min-w-0 overflow-x-hidden px-3 lg:px-6">
      <div className="text-center space-y-2">
        <h1 className="t-page">{isEn ? "Payment Management" : "Ödeme Yönetimi"}</h1>
        <p className="t-desc">
          {isEn
            ? "Review driver subscription payments, approve them, and manage active periods"
            : "Sürücü abonelik ödemelerini inceleyin, onaylayın ve aktiflik süresini yönetin"}
        </p>
      </div>

      {/* EKLENDİ */}
      <div className="flex flex-col gap-3 w-full max-w-full min-w-0 lg:flex-row lg:justify-between lg:items-center">
        <input
          placeholder={isEn ? "Search driver..." : "Sürücü ara..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input input-glow w-full max-w-full min-w-0 lg:w-64"
        />

        <div className="flex gap-2 flex-wrap justify-start lg:justify-end w-full max-w-full min-w-0">
          {[
            ["all", isEn ? "All" : "Tümü"],
            ["pending", isEn ? "Pending" : "Bekliyor"],
            ["approved", isEn ? "Approved" : "Onaylandı"],
            ["rejected", isEn ? "Rejected" : "Reddedildi"],
            ["active", isEn ? "Active" : "Aktif"],
            ["expired", isEn ? "Expired" : "Süresi Biten"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-lg border text-sm transition ${
                filter === key
                  ? "bg-[#f5b700] text-black"
                  : "border-[#2a2a2a] text-gray-300 hover:border-[#f5b700]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* EKLENDİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-full min-w-0">
        <Stat title={isEn ? "Pending" : "Bekleyen"} value={String(pendingCount)} color="yellow" />
        <Stat title={isEn ? "Approved" : "Onaylanan"} value={String(approvedCount)} color="green" />
        <Stat title={isEn ? "Rejected" : "Reddedilen"} value={String(rejectedCount)} color="red" />
        <Stat title={isEn ? "Active Drivers" : "Aktif Sürücü"} value={String(activeDriverCount)} color="blue" />
      </div>

      {/* EKLENDİ */}
      <div className="card-glow rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-3 lg:p-6 w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard size={18} className="text-[#f5b700]" />
          <p className="t-title">{isEn ? "Payment List" : "Ödeme Listesi"}</p>
        </div>

        <div className="space-y-4">
          {filtered.map((p) => {
            const access = getDriverAccess(p);
            const remaining = getRemainingTime(p.expireAt, nowTick, isEn);

            return (
              <div
                key={p.id}
                className="relative rounded-xl border border-[#2a2a2a] hover:border-[#f5b700]/40 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(245,183,0,0.15)] w-full max-w-full min-w-0 overflow-hidden"
              >
                {/* EKLENDİ */}
                <div className="flex flex-col gap-3 p-3 w-full max-w-full min-w-0 overflow-hidden lg:grid lg:grid-cols-[1.3fr_160px_160px_170px_170px] lg:items-center lg:gap-4 lg:p-4">
                  <div className="space-y-1 min-w-0 w-full max-w-full break-words">
                    <p className="t-title break-words">{p.name}</p>
                    <p className="t-desc break-words">
                      {(p.plan === "Haftalık" ? (isEn ? "Weekly" : "Haftalık") : (isEn ? "Monthly" : "Aylık"))} • {formatCurrency(p.amount, isEn, settings.currency)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updatePlan(p.id, "Haftalık")}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                          p.plan === "Haftalık"
                            ? "bg-[#f5b700] text-black border-[#f5b700]"
                            : "border-[#333] text-gray-300 hover:border-[#f5b700]"
                        }`}
                      >
                        {isEn ? "Weekly" : "Haftalık"}
                      </button>
                      <button
                        onClick={() => updatePlan(p.id, "Aylık")}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                          p.plan === "Aylık"
                            ? "bg-[#f5b700] text-black border-[#f5b700]"
                            : "border-[#333] text-gray-300 hover:border-[#f5b700]"
                        }`}
                      >
                        {isEn ? "Monthly" : "Aylık"}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-start w-full max-w-full lg:justify-center">
                    <PaymentBadge status={p.status} isEn={isEn} />
                  </div>

                  <div className="flex justify-start w-full max-w-full lg:justify-center">
                    <AccessBadge access={access} isEn={isEn} />
                  </div>

                  <div className="text-left w-full max-w-full min-w-0 break-words lg:text-center">
                    <p className="text-[12px] text-gray-400 tracking-wide">{isEn ? "Expiry Date" : "Bitiş Tarihi"}</p>
                    <p className="text-[14px] font-medium text-white">{formatDateTR(p.expireAt, isEn)}</p>

                    {/* EKLENDİ: KALAN SÜRE */}
                    {p.status === "approved" && p.expireAt && (
                      <p
                        className={`text-[12px] font-semibold mt-1 ${
                          access === "expired"
                            ? "text-red-400"
                            : remaining && remaining !== (isEn ? "Expired" : "Süresi Doldu")
                            ? "text-yellow-400"
                            : "text-gray-400"
                        }`}
                      >
                        {isEn ? "Remaining" : "Kalan"}: {remaining}
                      </p>
                    )}
                  </div>

                  {/* FIXED ACTIONS */}
                  {/* EKLENDİ */}
                  <div className="flex flex-row flex-wrap items-center justify-start gap-3 relative z-10 w-full max-w-full min-w-0 lg:justify-center">
                    <button
                      onClick={() => {
                        if (!p.receipt) {
                          alert(isEn ? "Receipt not found for this payment." : "Bu ödeme için dekont bulunamadı.");
                          return;
                        }
                        setSelectedReceipt(p.receipt);
                      }}
                      className="icon-btn"
                    >
                      <Eye size={18} />
                    </button>

                    {p.status !== "approved" && (
                      <>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            console.log("APPROVE CLICK WORKING");
                            try {
                              await approvePayment(p.id);
                            } catch (error) {
                              console.error("payment approve click error:", error);
                              alert(isEn ? "Approve action failed." : "Onay işlemi başarısız oldu.");
                            }
                          }}
                          disabled={false}
                          className="icon-btn success pointer-events-auto"
                          style={{ pointerEvents: "auto", zIndex: 30, position: "relative" }}
                        >
                          <Check size={18} />
                        </button>

                        {p.status === "pending" && (
                          <button
                            onClick={() => {
                              console.log("CLICK OK", p.id);
                              void rejectPayment(p.id);
                            }}
                            className="icon-btn danger"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </>
                    )}

                    {p.status !== "pending" && (
                      <button onClick={() => resetPaymentToPending(p.id)} className="icon-btn">
                        <RotateCcw size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {p.status === "approved" && p.expireAt && (
                  /* EKLENDİ */
                  <div className="px-3 pb-3 lg:px-4 lg:pb-4 w-full max-w-full min-w-0">
                    {/* EKLENDİ */}
                    <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] px-3 py-3 lg:px-4 flex flex-col gap-2 items-start w-full max-w-full min-w-0 overflow-hidden lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-2 text-green-400 min-w-0 break-words">
                        <Clock3 size={16} />
                        <span className="text-[14px] font-medium">
                          {p.plan === "Haftalık"
                            ? (isEn ? "7-day subscription active" : "7 günlük abonelik aktif")
                            : (isEn ? "30-day subscription active" : "30 günlük abonelik aktif")}
                        </span>
                      </div>

                      {/* EKLENDİ */}
                      <div className="text-left w-full max-w-full min-w-0 break-words lg:text-right">
                        <span className="text-[13px] text-gray-300 block break-words">
                          {isEn ? "Approved" : "Onay"}: {formatDateTR(p.approvedAt, isEn)} • {isEn ? "Expiry" : "Bitiş"}: {formatDateTR(p.expireAt, isEn)}
                        </span>

                        {/* EKLENDİ: ALT BANTTA DA KALAN SÜRE */}
                        <span
                          className={`text-[12px] font-semibold block mt-1 ${
                            access === "expired"
                              ? "text-red-400"
                              : remaining && remaining !== (isEn ? "Expired" : "Süresi Doldu")
                              ? "text-yellow-400"
                              : "text-gray-400"
                          }`}
                        >
                          {isEn ? "Remaining" : "Kalan"}: {remaining}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FIXED MODAL */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedReceipt(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="relative z-50">
            <img
              src={selectedReceipt}
              className="max-h-[80vh] rounded-xl border border-[#2a2a2a]"
            />

            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-3 right-3 bg-black/70 p-2 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* BADGE */
function PaymentBadge({ status, isEn }: { status: PaymentStatus; isEn: boolean }) {
  const map = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const text = {
    pending: isEn ? "Pending" : "Bekliyor",
    approved: isEn ? "Approved" : "Onaylandı",
    rejected: isEn ? "Rejected" : "Reddedildi",
  };

  return <div className={`px-4 py-1 rounded-lg border ${map[status]}`}>{text[status]}</div>;
}

/* ACCESS */
function AccessBadge({ access, isEn }: { access: DriverAccess; isEn: boolean }) {
  const map = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    expired: "bg-red-500/10 text-red-400 border-red-500/20",
    passive: "bg-gray-500/10 text-gray-300 border-gray-500/20",
  };

  const text = {
    pending: isEn ? "Pending Approval" : "Onay Bekliyor",
    active: isEn ? "Active" : "Aktif",
    expired: isEn ? "Expired" : "Süresi Doldu",
    passive: isEn ? "Passive" : "Pasif",
  };

  const Icon =
    access === "active"
      ? ShieldCheck
      : access === "expired" || access === "passive"
      ? ShieldX
      : Clock3;

  return (
    <div className={`px-4 py-1 rounded-lg border flex items-center gap-2 ${map[access]}`}>
      <Icon size={14} />
      <span>{text[access]}</span>
    </div>
  );
}

/* STAT */
function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "yellow" | "green" | "red" | "blue";
}) {
  const colors = {
    yellow: "from-yellow-500/10 to-yellow-500/0 text-yellow-400",
    green: "from-green-500/10 to-green-500/0 text-green-400",
    red: "from-red-500/10 to-red-500/0 text-red-400",
    blue: "from-cyan-500/10 to-cyan-500/0 text-cyan-400",
  };

  return (
    /* EKLENDİ */
    <div className={`p-3 lg:p-5 rounded-xl bg-linear-to-br ${colors[color]} border border-[#2a2a2a] w-full max-w-full min-w-0 overflow-hidden`}>
      <p className="t-desc">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}