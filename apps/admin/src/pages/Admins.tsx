import { useEffect, useState } from "react";
import { UserPlus, ShieldCheck, MoreVertical, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api.ts";
import { useAuth } from "@/store/AuthContext.tsx";

type AdminRoleOption = {
  code: string;
  display_name: string;
  sort_order: number;
};

type AdminItem = {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display?: string;
  status: string;
};

const DEFAULT_ADMIN_ROLES: AdminRoleOption[] = [
  { code: "super_admin", display_name: "Süper Admin", sort_order: 1 },
  { code: "yonetici", display_name: "Yönetici", sort_order: 2 },
];

function roleLabel(admin: AdminItem, roles: AdminRoleOption[], isEn: boolean) {
  if (admin.role === "super_admin") return isEn ? "Super Admin" : "Süper Admin";
  if (admin.role === "yonetici") return isEn ? "Manager" : "Yönetici";
  const list = roles.length > 0 ? roles : DEFAULT_ADMIN_ROLES;
  const fromApi = admin.role_display?.trim();
  if (fromApi) return fromApi;
  const hit = list.find((r) => r.code === admin.role);
  return hit?.display_name ?? admin.role;
}

function statusLabel(status: string, isEn: boolean) {
  const s = String(status || "").toLowerCase();
  if (s === "aktif" || s === "active") return isEn ? "Active" : "Aktif";
  if (s === "pasif" || s === "passive") return isEn ? "Passive" : "Pasif";
  return status;
}

function normalizedAdminName(admin: AdminItem) {
  return admin.role === "super_admin" ? "Super Admin" : admin.name;
}

function normalizedAdminEmail(admin: AdminItem) {
  return String(admin.email || "").toLowerCase();
}

export default function Admins() {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const { user, isSuperAdmin } = useAuth();
  const currentId = user?.id != null ? Number(user.id) : NaN;
  const isDemoUser = String(user?.email || "").toLowerCase() === "demo@user.com";

  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "yonetici" as "super_admin" | "yonetici",
    status: "Aktif",
  });
  const [editModal, setEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "yonetici" as "super_admin" | "yonetici",
  });

  const superAdminCount = admins.filter((a) => a.role === "super_admin").length;
  const roleOptions = roles.length > 0 ? roles : DEFAULT_ADMIN_ROLES;

  const loadRoles = async () => {
    try {
      const { data } = await api.get<AdminRoleOption[]>("/admins/roles");
      setRoles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Roles load error:", e);
      setRoles([
        { code: "super_admin", display_name: "Süper Admin", sort_order: 1 },
        { code: "yonetici", display_name: "Yönetici", sort_order: 2 },
      ]);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<AdminItem[]>("/admins");
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Admins load error:", error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
    void loadAdmins();
  }, []);

  const addAdmin = async () => {
    if (!isSuperAdmin) return;
    try {
      setSaving(true);
      const { data } = await api.post<AdminItem>("/admins", {
        name: newAdmin.name,
        email: newAdmin.email,
        status: newAdmin.status,
        role: newAdmin.role,
      });
      if (data) setAdmins((prev) => [...prev, data]);
      setNewAdmin({ name: "", email: "", role: "yonetici", status: "Aktif" });
      setShowForm(false);
      await loadAdmins();
    } catch (error) {
      console.error("Admin create error:", error);
    } finally {
      setSaving(false);
    }
  };

  const openEditSuper = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    const code = admin.role === "super_admin" || admin.role === "yonetici" ? admin.role : "yonetici";
    setForm({
      name: normalizedAdminName(admin),
      email: normalizedAdminEmail(admin),
      password: "",
      role: code,
    });
    setEditModal(true);
  };

  const openEditSelfPassword = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    const code = admin.role === "super_admin" || admin.role === "yonetici" ? admin.role : "yonetici";
    setForm({
      name: normalizedAdminName(admin),
      email: normalizedAdminEmail(admin),
      password: "",
      role: code,
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedAdmin) return;
    try {
      if (isSuperAdmin) {
        await api.put(`/admins/${selectedAdmin.id}`, form);
      } else {
        if (Number(selectedAdmin.id) !== currentId) return;
        if (!form.password.trim()) return;
        await api.put(`/admins/${selectedAdmin.id}`, {
          password: form.password,
        });
      }
      setEditModal(false);
      await loadAdmins();
    } catch (error) {
      console.error("Admin update error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isSuperAdmin) return;
  const ok = window.confirm(isEn ? "Do you want to delete?" : "Silmek istiyor musun?");
    if (!ok) return;
    try {
      await api.delete(`/admins/${id}`);
      await loadAdmins();
    } catch (error) {
      console.error("Admin delete error:", error);
    }
  };

  const canDeleteRow = (admin: AdminItem) => {
    if (admin.role !== "super_admin") return true;
    return superAdminCount > 1;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{isEn ? "Sub Admins" : "Alt Yöneticiler"}</h1>
          <p className="text-gray-400 text-sm">
            {isSuperAdmin
              ? (isEn
                ? "List of staff with panel access. Roles: super_admin, yonetici."
                : "Panel erişimi olan personel listesi. Roller: super_admin (Süper Admin), yonetici (Yönetici).")
              : (isEn
                ? "You can view the list; only your own password can be updated."
                : "Listeyi görüntüleyebilir; yalnızca kendi şifrenizi güncelleyebilirsiniz.")}
          </p>
        </div>
        {isSuperAdmin ? (
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="flex items-center gap-2 bg-[#f5b700] text-black px-5 py-2.5 rounded-xl font-bold hover:scale-[1.02] transition-all"
          >
            <UserPlus size={18} /> {isEn ? "New Admin" : "Yeni Yönetici"}
          </button>
        ) : null}
      </div>

      {showForm && isSuperAdmin ? (
        <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            value={newAdmin.name}
            onChange={(e) => setNewAdmin((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={isEn ? "Full name" : "Ad Soyad"}
            className="bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none"
          />
          <input
            value={newAdmin.email}
            onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
            placeholder={isEn ? "Email" : "E-posta"}
            className="bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none"
          />
          <select
            value={newAdmin.role}
            onChange={(e) =>
              setNewAdmin((prev) => ({
                ...prev,
                role: e.target.value === "super_admin" ? "super_admin" : "yonetici",
              }))
            }
            className="bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5b700]"
          >
            {roleOptions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.display_name} ({r.code})
              </option>
            ))}
          </select>
          <select
            value={newAdmin.status}
            onChange={(e) => setNewAdmin((prev) => ({ ...prev, status: e.target.value }))}
            className="bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none"
          >
            <option value="Aktif">{isEn ? "Active" : "Aktif"}</option>
            <option value="Pasif">{isEn ? "Passive" : "Pasif"}</option>
          </select>
          <button
            type="button"
            onClick={addAdmin}
            disabled={saving}
            className="bg-[#f5b700] text-black px-4 py-2 rounded-xl font-bold disabled:opacity-60 lg:col-span-1"
          >
            {saving ? (isEn ? "Adding..." : "Ekleniyor...") : (isEn ? "Add Admin" : "Yönetici Ekle")}
          </button>
        </div>
      ) : null}

      <div className="bg-[#161616] border border-[#262626] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#1a1a1a]/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {isEn ? "Admin" : "Yönetici"}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{isEn ? "Role" : "Rol"}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{isEn ? "Status" : "Durum"}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                  {isEn ? "Actions" : "İşlemler"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm text-gray-500">
                    {isEn ? "Loading admin list..." : "Yönetici listesi yükleniyor..."}
                  </td>
                </tr>
              ) : null}
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-white/2 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f5b700] flex items-center justify-center text-black font-bold">
                        {normalizedAdminName(admin)[0] ?? "?"}
                      </div>
                      <div>
                        <div className="text-white font-medium">{normalizedAdminName(admin)}</div>
                        <div className="text-gray-500 text-xs">{normalizedAdminEmail(admin)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="flex flex-col gap-0.5 text-gray-300">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#f5b700]" />
                        {roleLabel(admin, roleOptions, isEn)}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">{admin.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                      {statusLabel(admin.status, isEn)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isSuperAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditSuper(admin)}
                          className="p-2 hover:bg-[#262626] rounded-lg text-gray-500"
                          aria-label={isEn ? "Edit" : "Düzenle"}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {canDeleteRow(admin) ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(admin.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 ml-2"
                          >
                            {isEn ? "Delete" : "Sil"}
                          </button>
                        ) : null}
                      </>
                    ) : Number(admin.id) === currentId ? (
                      <button
                        type="button"
                        aria-disabled={isDemoUser}
                        onClick={() => {
                          if (isDemoUser) {
                            window.alert(
                              isEn
                                ? "This action is disabled in demo mode."
                                : "Demo modda kapalı"
                            );
                            return;
                          }
                          openEditSelfPassword(admin);
                        }}
                        title={isDemoUser ? (isEn ? "Disabled in demo mode" : "Demo modda kapalı") : ""}
                        className={
                          "inline-flex items-center gap-2 rounded-lg border border-[#f5b700]/40 bg-[#f5b700]/10 px-3 py-2 text-sm font-semibold text-[#f5b700] hover:bg-[#f5b700]/20" +
                          (isDemoUser ? " opacity-50 cursor-not-allowed hover:bg-[#f5b700]/10" : "")
                        }
                      >
                        <KeyRound size={16} />
                        {isEn ? "Change my password" : "Şifremi değiştir"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editModal && selectedAdmin ? (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-md border border-[#262626]">
            <h2 className="text-xl mb-4 text-white">
              {isSuperAdmin ? (isEn ? "Edit admin" : "Yönetici düzenle") : (isEn ? "Change password" : "Şifre değiştir")}
            </h2>

            <div className="space-y-3">
              {isSuperAdmin ? (
                <>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none"
                    placeholder={isEn ? "Full name" : "Ad Soyad"}
                  />
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none"
                    placeholder={isEn ? "Email" : "E-posta"}
                  />
                  <label className="block text-xs text-gray-500">{isEn ? "Role" : "Rol"}</label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value === "super_admin" ? "super_admin" : "yonetici",
                      })
                    }
                    className="w-full bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none focus:border-[#f5b700]"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.display_name} ({r.code})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  {normalizedAdminName(selectedAdmin)} — {normalizedAdminEmail(selectedAdmin)}
                </p>
              )}

              <input
                type="password"
                placeholder={
                  isSuperAdmin
                    ? (isEn ? "New password (optional)" : "Yeni şifre (isteğe bağlı)")
                    : (isEn ? "New password" : "Yeni şifre")
                }
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-black border border-[#262626] rounded-xl px-3 py-2 text-white outline-none"
                autoComplete="new-password"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleUpdate}
                className="bg-[#f5b700] text-black px-4 py-2 rounded-xl font-bold"
              >
                {isEn ? "Save" : "Kaydet"}
              </button>
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="bg-[#262626] text-white px-4 py-2 rounded-xl font-bold"
              >
                {isEn ? "Cancel" : "Vazgeç"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
