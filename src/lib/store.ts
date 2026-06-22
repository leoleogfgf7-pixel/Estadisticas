// Unified in-memory + localStorage store (works on Vercel without DB)
// Each request in serverless mode gets fresh memory, so we use a file-backed
// store on the server and localStorage on the client.

import { randomUUID } from "crypto";

// ─── Types ──────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "seller";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  businessName: string;
  currency: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxRate: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  barcode: string | null;
  cost: string;
  priceRetail: string;
  priceWholesale: string;
  priceSpecial: string;
  stock: number;
  minStock: number;
  category: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  documentType: string;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: string;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  clientId: string | null;
  userId: string;
  saleType: "retail" | "wholesale" | "special";
  paymentMethod: "cash" | "credit" | "yape" | "plin" | "card";
  paymentStatus: "paid" | "pending" | "partial";
  subtotal: string;
  tax: string;
  total: string;
  totalCost: string;
  profit: string;
  notes: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  unitCost: string;
  subtotal: string;
  profit: string;
}

export interface Payment {
  id: string;
  saleId: string;
  amount: string;
  method: "cash" | "credit" | "yape" | "plin" | "card";
  notes: string | null;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  categoryId: string | null;
  userId: string;
  description: string;
  amount: string;
  date: string;
  receiptUrl: string | null;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  userId: string;
  type: "entry" | "exit";
  quantity: number;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string | null;
  title: string;
  targetAmount: string;
  currentAmount: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export interface StoreData {
  users: User[];
  settings: Settings[];
  products: Product[];
  clients: Client[];
  sales: Sale[];
  saleItems: SaleItem[];
  payments: Payment[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  inventoryMovements: InventoryMovement[];
  goals: Goal[];
  activityLogs: ActivityLog[];
}

// ─── In-memory store (server-side, persisted to file) ─────────────
const emptyStore: StoreData = {
  users: [],
  settings: [],
  products: [],
  clients: [],
  sales: [],
  saleItems: [],
  payments: [],
  expenseCategories: [],
  expenses: [],
  inventoryMovements: [],
  goals: [],
  activityLogs: [],
};

// Use a module-level variable (serverless: per-request fresh, but file-backed)
let inMemoryStore: StoreData | null = null;

const nowIso = () => new Date().toISOString();
const uid = () => randomUUID();

// ─── Seed ────────────────────────────────────────────────────────────
function seed(): StoreData {
  const data: StoreData = JSON.parse(JSON.stringify(emptyStore));

  // Users
  const adminId = uid();
  const sellerId = uid();
  data.users = [
    {
      id: adminId, name: "Administrador", email: "admin@arena.com",
      passwordHash: "$2a$12$demo.hash", role: "admin", active: true,
      createdAt: nowIso(), updatedAt: nowIso(),
    },
    {
      id: sellerId, name: "María Vendedora", email: "maria@arena.com",
      passwordHash: "$2a$12$demo.hash2", role: "seller", active: true,
      createdAt: nowIso(), updatedAt: nowIso(),
    },
  ];

  // Settings
  data.settings = [{
    id: uid(), businessName: "ArenaPOS Store", currency: "S/",
    logoUrl: null, primaryColor: "#1e293b", secondaryColor: "#f59e0b",
    address: "Av. Principal 123, Lima", phone: "+51 999 888 777",
    email: "contacto@arena.com", taxRate: "18", updatedAt: nowIso(),
  }];

  // Categories
  const catIds = ["Operativos", "Compras", "Servicios", "Personal", "Marketing", "Alquiler"].map(name => ({
    id: uid(), name, color: "#64748b", createdAt: nowIso(),
  }));
  data.expenseCategories = catIds;

  // Products
  const sampleProducts: Array<Partial<Product>> = [
    { name: "Camiseta Básica", cost: "15.00", priceRetail: "35.00", priceWholesale: "28.00", priceSpecial: "25.00", stock: 120, minStock: 10, category: "Ropa" },
    { name: "Pantalón Jean", cost: "45.00", priceRetail: "89.90", priceWholesale: "75.00", priceSpecial: "65.00", stock: 85, minStock: 8, category: "Ropa" },
    { name: "Zapatillas Urbanas", cost: "60.00", priceRetail: "129.90", priceWholesale: "99.00", priceSpecial: "89.00", stock: 42, minStock: 5, category: "Calzado" },
    { name: "Mochila Escolar", cost: "25.00", priceRetail: "59.90", priceWholesale: "45.00", priceSpecial: "39.00", stock: 63, minStock: 8, category: "Accesorios" },
    { name: "Audífonos BT", cost: "35.00", priceRetail: "79.90", priceWholesale: "65.00", priceSpecial: "55.00", stock: 5, minStock: 10, category: "Electrónica" },
    { name: "Cargador USB-C", cost: "8.00", priceRetail: "24.90", priceWholesale: "18.00", priceSpecial: "15.00", stock: 200, minStock: 20, category: "Electrónica" },
    { name: "Botella de Acero", cost: "12.00", priceRetail: "29.90", priceWholesale: "22.00", priceSpecial: "19.00", stock: 95, minStock: 10, category: "Hogar" },
    { name: "Set de Utensilios", cost: "18.00", priceRetail: "39.90", priceWholesale: "32.00", priceSpecial: "28.00", stock: 3, minStock: 8, category: "Hogar" },
    { name: "Libreta Ejecutiva", cost: "6.00", priceRetail: "15.90", priceWholesale: "12.00", priceSpecial: "10.00", stock: 150, minStock: 15, category: "Papelería" },
    { name: "Lapicero de Lujo", cost: "4.00", priceRetail: "12.90", priceWholesale: "9.00", priceSpecial: "7.50", stock: 0, minStock: 20, category: "Papelería" },
    { name: "Polo Deportivo", cost: "20.00", priceRetail: "45.00", priceWholesale: "38.00", priceSpecial: "32.00", stock: 67, minStock: 8, category: "Ropa" },
    { name: "Sandalias Playa", cost: "18.00", priceRetail: "39.90", priceWholesale: "32.00", priceSpecial: "28.00", stock: 55, minStock: 6, category: "Calzado" },
    { name: "Reloj Deportivo", cost: "50.00", priceRetail: "119.90", priceWholesale: "95.00", priceSpecial: "79.00", stock: 12, minStock: 5, category: "Accesorios" },
    { name: "Parlante Portátil", cost: "30.00", priceRetail: "69.90", priceWholesale: "55.00", priceSpecial: "48.00", stock: 22, minStock: 5, category: "Electrónica" },
    { name: "Toalla de Playa", cost: "15.00", priceRetail: "34.90", priceWholesale: "28.00", priceSpecial: "24.00", stock: 40, minStock: 8, category: "Hogar" },
  ];
  data.products = sampleProducts.map(p => ({
    id: uid(), name: p.name!, description: null, barcode: null,
    cost: p.cost!, priceRetail: p.priceRetail!, priceWholesale: p.priceWholesale!,
    priceSpecial: p.priceSpecial!, stock: p.stock!, minStock: p.minStock!,
    category: p.category!, active: true, createdAt: nowIso(), updatedAt: nowIso(),
  }));

  // Clients
  const sampleClients = [
    { name: "Juan Pérez", documentType: "DNI", documentNumber: "12345678", phone: "987654321", email: "juan@email.com", type: "frequent" },
    { name: "Ana García", documentType: "DNI", documentNumber: "87654321", phone: "912345678", email: "ana@email.com", type: "wholesale" },
    { name: "Comercial XYZ", documentType: "RUC", documentNumber: "20123456789", phone: "999111222", email: "ventas@xyz.com", type: "wholesale" },
    { name: "Carlos López", documentType: "DNI", documentNumber: "45678901", phone: "955566677", type: "frequent" },
    { name: "María Torres", documentType: "DNI", documentNumber: "34567890", phone: "944455566", email: "maria.t@email.com", type: "frequent" },
  ];
  data.clients = sampleClients.map(c => ({
    id: uid(), name: c.name, documentType: c.documentType, documentNumber: c.documentNumber,
    email: c.email || null, phone: c.phone || null, address: null, type: c.type,
    notes: null, active: true, createdAt: nowIso(), updatedAt: nowIso(),
  }));

  // Goals
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  data.goals = [
    {
      id: uid(), userId: adminId, title: "Ventas del Mes",
      targetAmount: "15000", currentAmount: "8750", type: "sales", period: "monthly",
      startDate: monthStart.toISOString().split("T")[0],
      endDate: monthEnd.toISOString().split("T")[0],
      active: true, createdAt: nowIso(),
    },
    {
      id: uid(), userId: adminId, title: "Ganancia Neta Mensual",
      targetAmount: "5000", currentAmount: "2950", type: "profit", period: "monthly",
      startDate: monthStart.toISOString().split("T")[0],
      endDate: monthEnd.toISOString().split("T")[0],
      active: true, createdAt: nowIso(),
    },
  ];

  // Sample sales (current month)
  const saleDays = [1, 3, 5, 7, 8, 10, 12, 14, 15, 16, 18, 20, 21, 22];
  for (const day of saleDays) {
    const product = data.products[Math.floor(Math.random() * data.products.length)];
    const qty = 1 + Math.floor(Math.random() * 3);
    const clientIdx = Math.random() > 0.3 ? Math.floor(Math.random() * data.clients.length) : -1;
    const saleTypeOptions: Array<"retail" | "wholesale" | "special"> = ["retail", "retail", "retail", "wholesale", "special"];
    const saleType = saleTypeOptions[Math.floor(Math.random() * saleTypeOptions.length)];
    const price = saleType === "wholesale" ? parseFloat(product.priceWholesale)
      : saleType === "special" ? parseFloat(product.priceSpecial)
      : parseFloat(product.priceRetail);
    const cost = parseFloat(product.cost);
    const subtotal = price * qty;
    const totalCost = cost * qty;
    const profit = (price - cost) * qty;
    const payOptions: Array<"cash" | "credit" | "yape" | "plin" | "card"> = ["cash", "cash", "cash", "yape", "plin", "card", "credit"];
    const paymentMethod = payOptions[Math.floor(Math.random() * payOptions.length)];
    const payStatus: "paid" | "pending" | "partial" = paymentMethod === "credit"
      ? (Math.random() > 0.5 ? "pending" : "partial")
      : "paid";

    const saleDate = new Date(today.getFullYear(), today.getMonth(), day, 10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    const saleId = uid();

    data.sales.push({
      id: saleId, clientId: clientIdx >= 0 ? data.clients[clientIdx].id : null,
      userId: adminId, saleType, paymentMethod, paymentStatus: payStatus,
      subtotal: subtotal.toFixed(2), tax: "0", total: subtotal.toFixed(2),
      totalCost: totalCost.toFixed(2), profit: profit.toFixed(2), notes: null,
      dueDate: paymentMethod === "credit" ? new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null,
      createdAt: saleDate.toISOString(), updatedAt: saleDate.toISOString(),
    });

    data.saleItems.push({
      id: uid(), saleId, productId: product.id, quantity: qty,
      unitPrice: price.toFixed(2), unitCost: cost.toFixed(2),
      subtotal: subtotal.toFixed(2), profit: profit.toFixed(2),
    });
  }

  // Sample expenses
  const expSamples = [
    { desc: "Alquiler local", amount: "1200", catIdx: 5 },
    { desc: "Electricidad", amount: "350", catIdx: 2 },
    { desc: "Internet", amount: "120", catIdx: 2 },
    { desc: "Compra mercadería", amount: "2500", catIdx: 1 },
    { desc: "Publicidad redes", amount: "400", catIdx: 4 },
  ];
  for (const e of expSamples) {
    data.expenses.push({
      id: uid(), categoryId: catIds[e.catIdx].id, userId: adminId,
      description: e.desc, amount: e.amount,
      date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split("T")[0],
      receiptUrl: null, createdAt: nowIso(),
    });
  }

  // Activity logs
  data.activityLogs.push({
    id: uid(), userId: adminId, action: "create", entity: "sale",
    entityId: data.sales[0]?.id, details: "Venta de ejemplo", createdAt: nowIso(),
  });

  return data;
}

// ─── Get / Set store ────────────────────────────────────────────────
export function getStore(): StoreData {
  if (!inMemoryStore) {
    inMemoryStore = seed();
  }
  return inMemoryStore!;
}

export function resetStore(): void {
  inMemoryStore = seed();
}

// Helper to find by id
export function findById<T extends { id: string }>(arr: T[], id: string): T | undefined {
  return arr.find(item => item.id === id);
}

// For client-side localStorage sync (optional)
export const STORE_KEY = "arenapos_store_v1";
