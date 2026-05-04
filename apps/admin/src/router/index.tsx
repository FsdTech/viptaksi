/* EKLENDİ - 2026-04-04 */
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout.tsx";
import Drivers from "@/pages/Drivers.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import LiveMap from "@/components/map/LiveMap.tsx";
import DriverDetail from "@/pages/DriverDetail.tsx";
import Passengers from "@/pages/Passengers.tsx";
import Pricing from "@/pages/Pricing.tsx";
import Payments from "@/pages/Payments.tsx";
import Trips from "@/pages/Trips.tsx";
import Settings from "@/pages/Settings.tsx";
import Admins from "@/pages/Admins.tsx";
import Login from "@/pages/Login.tsx";
/* EKLENDİ - 2026-04-04 */
import DriverApplication from "@/pages/DriverApplication.tsx";
/* EKLENDİ - 2026-04-04 */
import VehicleTypes from "@/pages/VehicleTypes.tsx";
import { useAuth } from "@/store/AuthContext.tsx";

export function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* EKLENDİ - 2026-04-04 — sürücü kayıt (auth dışı) */}
      <Route path="/driver/register" element={<DriverApplication />} />

      {!isAuthenticated ? (
        <Route path="*" element={<Login />} />
      ) : (
        <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        {/* EKLENDİ */}
        <Route
          path="/map"
          element={
            <div className="flex-1 min-h-0 w-full max-w-full flex flex-col overflow-hidden relative z-0">
              <LiveMap />
            </div>
          }
        />
        <Route path="/trips" element={<Trips />} />
        <Route path="/drivers" element={<Drivers />} />
        {/* EKLENDİ - 2026-04-04 */}
        <Route path="/vehicle-types" element={<VehicleTypes />} />
        <Route path="/drivers/:id" element={<DriverDetail />} />
        <Route path="/passengers" element={<Passengers />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/admins" element={<Admins />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard-classic" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  );
}
