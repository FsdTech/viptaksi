/* EKLENDİ - 2026-04-04 — konum: src/store/BillingSyncContext.tsx (önceden src/BillingSyncContext.tsx) */
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
/* EKLENDİ - 2026-04-04 */
import type { VehicleTypeId } from "@/types/vehicleTypes.ts";
/* EKLENDİ - 2026-04-04 */
import {
  vehicleTypeToLegacyBillingType,
} from "@/types/vehicleTypes.ts";

export type PaymentStatus = "pending" | "approved" | "rejected";
export type DriverAccess = "pending" | "active" | "expired" | "passive";

export type BillingPayment = {
  status: PaymentStatus;
  plan: "Haftalık" | "Aylık";
  amount: number;
  receipt: string;
  approvedAt: Date | null;
  expireAt: Date | null;
};

export type BillingDriver = {
  id: number;
  name: string;
  phone: string;
  plate: string;
  vehicle: string;
  /* EKLENDİ - 2026-04-04 — gerçek araç sınıfı (admin + sürücü kayıt) */
  vehicleType: VehicleTypeId;
  type: "normal" | "premium";
  status: "active" | "passive" | "banned";
  online: boolean;
  rating: number;
  payment: BillingPayment;
};

export type PaymentRow = {
  id: number;
  name: string;
  plan: "Haftalık" | "Aylık";
  amount: number;
  status: PaymentStatus;
  receipt: string;
  approvedAt: Date | null;
  expireAt: Date | null;
};

type BillingState = {
  drivers: BillingDriver[];
};

type BillingSyncContextValue = {
  getSnapshot: () => BillingState;
  subscribe: (listener: () => void) => () => void;
  approvePayment: (driverId: number) => void;
  rejectPayment: (driverId: number) => void;
  resetPaymentToPending: (driverId: number) => void;
  updateDriverPayment: (driverId: number, payment: Partial<BillingPayment>) => void;
  /* EKLENDİ - 2026-04-04 */
  registerDriverFromForm: (payload: {
    name: string;
    phone: string;
    plate: string;
    vehicle: string;
    vehicleType: VehicleTypeId;
    /* EKLENDİ - 2026-04-04 */
    receipt?: string;
  }) => void;
  /* EKLENDİ - 2026-04-04 */
  updateDriverVehicleType: (
    driverId: number,
    vehicleType: VehicleTypeId
  ) => void;
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getPlanDays(plan: "Haftalık" | "Aylık") {
  return plan === "Haftalık" ? 7 : 30;
}

/* EKLENDİ */
const initialDrivers: BillingDriver[] = [];

function loadInitialState(): BillingState {
  return { drivers: initialDrivers };
}

/* EKLENDİ */
let billingState: BillingState = loadInitialState();

/* EKLENDİ */
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function persistState() {
  return;
}

function setBillingState(updater: (prev: BillingState) => BillingState) {
  billingState = updater(billingState);
  persistState();
  emitChange();
}

function mapPaymentsFromDrivers(drivers: BillingDriver[]): PaymentRow[] {
  return drivers.map((driver) => ({
    id: driver.id,
    name: driver.name,
    plan: driver.payment.plan,
    amount: driver.payment.amount,
    status: driver.payment.status,
    receipt: driver.payment.receipt,
    approvedAt: driver.payment.approvedAt,
    expireAt: driver.payment.expireAt,
  }));
}

/* EKLENDİ */

const billingStore: BillingSyncContextValue = {
  getSnapshot: () => billingState,
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  approvePayment: (driverId) => {
    setBillingState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) => {
        if (driver.id !== driverId) return driver;

        const approvedAt = new Date();
        const expireAt = addDays(approvedAt, getPlanDays(driver.payment.plan));

        return {
          ...driver,
          payment: {
            ...driver.payment,
            status: "approved",
            approvedAt,
            expireAt,
          },
        };
      }),
    }));
  },
  rejectPayment: (driverId) => {
    setBillingState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              payment: {
                ...driver.payment,
                status: "rejected",
                approvedAt: null,
                expireAt: null,
              },
            }
          : driver
      ),
    }));
  },
  resetPaymentToPending: (driverId) => {
    setBillingState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              payment: {
                ...driver.payment,
                status: "pending",
                approvedAt: null,
                expireAt: null,
              },
            }
          : driver
      ),
    }));
  },
  updateDriverPayment: (driverId, payment) => {
    setBillingState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              payment: {
                ...driver.payment,
                ...payment,
              },
            }
          : driver
      ),
    }));
  },
  /* EKLENDİ - 2026-04-04 */
  registerDriverFromForm: (payload) => {
    setBillingState((prev) => {
      const nextId =
        prev.drivers.length === 0
          ? 1
          : Math.max(...prev.drivers.map((d) => d.id)) + 1;
      const vt = payload.vehicleType;
      return {
        ...prev,
        drivers: [
          ...prev.drivers,
          {
            id: nextId,
            name: payload.name.trim(),
            phone: payload.phone.trim(),
            plate: payload.plate.trim(),
            vehicle: payload.vehicle.trim(),
            vehicleType: vt,
            type: vehicleTypeToLegacyBillingType(vt),
            status: "active",
            online: false,
            rating: 0,
            payment: {
              status: "pending",
              plan: "Haftalık",
              amount: 2000,
              receipt: payload.receipt?.trim() ?? "",
              approvedAt: null,
              expireAt: null,
            },
          },
        ],
      };
    });
  },
  /* EKLENDİ - 2026-04-04 */
  updateDriverVehicleType: (driverId, vehicleType) => {
    setBillingState((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) =>
        driver.id === driverId
          ? {
              ...driver,
              vehicleType,
              type: vehicleTypeToLegacyBillingType(vehicleType),
            }
          : driver
      ),
    }));
  },
};

const BillingSyncContext = createContext<BillingSyncContextValue>(billingStore);

/* EKLENDİ */
export function BillingSyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    persistState();
  }, []);

  return <BillingSyncContext.Provider value={billingStore}>{children}</BillingSyncContext.Provider>;
}

/* EKLENDİ */
export function useBillingSync() {
  const store = useContext(BillingSyncContext);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  return {
    drivers: snapshot.drivers,
    payments: mapPaymentsFromDrivers(snapshot.drivers),
    approvePayment: store.approvePayment,
    rejectPayment: store.rejectPayment,
    resetPaymentToPending: store.resetPaymentToPending,
    updateDriverPayment: store.updateDriverPayment,
    /* EKLENDİ - 2026-04-04 */
    registerDriverFromForm: store.registerDriverFromForm,
    /* EKLENDİ - 2026-04-04 */
    updateDriverVehicleType: store.updateDriverVehicleType,
  };
}