// ArenaPOS - Unified in-memory store (works on Vercel without DB)
// Starts EMPTY - only users, settings, and expense categories are pre-created.

import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────
export interface User {
  id: string; name: string; email: string; passwordHash: string;
  role: "admin" | "seller"; active: boolean; createdAt: string; updatedAt: string;
}
export interface Settings {
  id: string; businessName: string; currency: string; logoUrl: string | null;
  primaryColor: string; secondaryColor: string; address: string | null;
  phone: string | null; email: string | null; taxRate: string; updatedAt: string;
}
export interface Product {
  id: string; name: string; description: string | null; barcode: string | null;
  cost: string; priceRetail: string; priceWholesale: string; priceSpecial: string;
  stock: number; minStock: number; category: string | null; active: boolean;
  createdAt: string; updatedAt: string;
}
export interface Client {
  id: string; name: string; documentType: string; documentNumber: string | null;
  email: string | null; phone: string | null; address: string | null;
  type: string; notes: string | null; active: boolean; createdAt: string; updatedAt: string;
}
export interface Sale {
  id: string; clientId: string | null; userId: string;
  saleType: "retail" | "wholesale" | "special";
  paymentMethod: "cash" | "credit" | "yape" | "plin" | "card";
  paymentStatus: "paid" | "pending" | "partial";
  subtotal: string; tax: string; total: string; totalCost: string; profit: string;
  notes: string | null; dueDate: string | null; createdAt: string; updatedAt: string;
}
export interface SaleItem {
  id: string; saleId: string; productId: string; quantity: number;
  unitPrice: string; unitCost: string; subtotal: string; profit: string;
}
export interface Payment {
  id: string; saleId: string; amount: string;
  method: "cash" | "credit" | "yape" | "plin" | "card";
  notes: string | null; createdAt: string;
}
export interface ExpenseCategory {
  id: string; name: string; color: string; createdAt: string;
}
export interface Expense {
  id: string; categoryId: string | null; userId: string; description: string;
  amount: string; date: string; receiptUrl: string | null; createdAt: string;
}
export interface InventoryMovement {
  id: string; productId: string; userId: string; type: "entry" | "exit";
  quantity: number; reason: string; referenceId: string | null; createdAt: string;
}
export interface Goal {
  id: string; userId: string | null; title: string; targetAmount: string;
  currentAmount: string; type: string; period: string; startDate: string;
  endDate: string; active: boolean; createdAt: string;
}
export interface ActivityLog {
  id: string; userId: string | null; action: string; entity: string;
  entityId: string | null; details: string | null; createdAt: string;
}
export interface StoreData {
  users: User[]; settings: Settings[]; products: Product[]; clients: Client[];
  sales: Sale[]; saleItems: SaleItem[]; payments: Payment[];
  expenseCategories: ExpenseCategory[]; expenses: Expense[];
  inventoryMovements: InventoryMovement[]; goals: Goal[]; activityLogs: ActivityLog[];
}

// ─── Empty store + minimal seed ─────────────────────────────────────
const emptyStore: StoreData = {
  users: [], settings: [], products: [], clients: [], sales: [],
  saleItems: [], payments: [], expenseCategories: [], expenses: [],
  inventoryMovements: [], goals: [], activityLogs: [],
};

const nowIso = () => new Date().toISOString();
const uid = () => randomUUID();

function seed(): StoreData {
  const data: StoreData = JSON.parse(JSON.stringify(emptyStore));

  // Default admin user (no password required in no-auth mode)
  const adminId = uid();
  data.users = [{
    id: adminId, name: "Usuario", email: "usuario@arena.com",
    passwordHash: "demo", role: "admin", active: true,
    createdAt: nowIso(), updatedAt: nowIso(),
  }];

  // Default settings - EMPTY, ready for user to fill
  data.settings = [{
    id: uid(), businessName: "Mi Negocio", currency: "S/",
    logoUrl: null, primaryColor: "#1e293b", secondaryColor: "#f59e0b",
    address: "", phone: "", email: "", taxRate: "18", updatedAt: nowIso(),
  }];

  // Common expense categories (useful but not "demo data")
  const defaultCats = ["Operativos", "Compras", "Servicios", "Personal", "Marketing", "Alquiler", "Transporte", "Otros"];
  data.expenseCategories = defaultCats.map(name => ({
    id: uid(), name, color: "#64748b", createdAt: nowIso(),
  }));

  return data;
}

// ─── Store access (persisted across serverless invocations) ─────────
const globalForStore = globalThis as typeof globalThis & {
  __arenaStore?: StoreData;
};

let inMemoryStore: StoreData | null = globalForStore.__arenaStore || null;

export function getStore(): StoreData {
  if (!inMemoryStore) {
    inMemoryStore = seed();
    globalForStore.__arenaStore = inMemoryStore;
  }
  return inMemoryStore!;
}

export function resetStore(): void {
  inMemoryStore = seed();
}

// ─── Serialization helpers (for backup/restore) ───────────────────
export function serializeStore(): string {
  return JSON.stringify(getStore());
}

export function restoreStore(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.users && parsed.products) {
      inMemoryStore = parsed;
      return true;
    }
  } catch {}
  return false;
}

export function getStoreStats() {
  const s = getStore();
  return {
    products: s.products.filter(p => p.active).length,
    clients: s.clients.filter(c => c.active).length,
    sales: s.sales.length,
    expenses: s.expenses.length,
    totalRevenue: s.sales.reduce((sum, x) => sum + parseFloat(x.total || "0"), 0),
    totalProfit: s.sales.reduce((sum, x) => sum + parseFloat(x.profit || "0"), 0),
  };
}
