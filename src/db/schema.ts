import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  integer,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["admin", "seller"]);
export const saleTypeEnum = pgEnum("sale_type", ["retail", "wholesale", "special"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "credit", "yape", "plin", "card"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "pending", "partial"]);
export const movementTypeEnum = pgEnum("movement_type", ["entry", "exit"]);

// ── Users ──────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("seller"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Settings (multi-business, currency, branding) ──────────────────
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull().default("Mi Negocio"),
  currency: text("currency").notNull().default("S/"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#1e293b"),
  secondaryColor: text("secondary_color").notNull().default("#f59e0b"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  taxRate: numeric("tax_rate").notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Products ───────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  barcode: text("barcode"),
  cost: numeric("cost").notNull().default("0"),
  priceRetail: numeric("price_retail").notNull().default("0"),
  priceWholesale: numeric("price_wholesale").notNull().default("0"),
  priceSpecial: numeric("price_special").notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(5),
  category: text("category"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Clients ────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  documentType: text("document_type").default("DNI"),
  documentNumber: text("document_number"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  type: text("type").notNull().default("frequent"), // frequent, wholesale
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Client custom prices ──────────────────────────────────────────
export const clientPrices = pgTable("client_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  customPrice: numeric("custom_price").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Sales ──────────────────────────────────────────────────────────
export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  saleType: saleTypeEnum("sale_type").notNull().default("retail"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("paid"),
  subtotal: numeric("subtotal").notNull().default("0"),
  tax: numeric("tax").notNull().default("0"),
  total: numeric("total").notNull().default("0"),
  totalCost: numeric("total_cost").notNull().default("0"),
  profit: numeric("profit").notNull().default("0"),
  notes: text("notes"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Sale Items ─────────────────────────────────────────────────────
export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price").notNull().default("0"),
  unitCost: numeric("unit_cost").notNull().default("0"),
  subtotal: numeric("subtotal").notNull().default("0"),
  profit: numeric("profit").notNull().default("0"),
});

// ── Payments (for credit sales) ────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull().default("0"),
  method: paymentMethodEnum("method").notNull().default("cash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Expenses ───────────────────────────────────────────────────────
export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").default("#64748b"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => expenseCategories.id, { onDelete: "set null" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  description: text("description").notNull(),
  amount: numeric("amount").notNull().default("0"),
  date: date("date").notNull().defaultNow(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Inventory Movements ────────────────────────────────────────────
export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull().default(0),
  reason: text("reason").notNull(),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Goals ──────────────────────────────────────────────────────────
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetAmount: numeric("target_amount").notNull().default("0"),
  currentAmount: numeric("current_amount").notNull().default("0"),
  type: text("type").notNull().default("sales"), // sales, profit, clients
  period: text("period").notNull().default("monthly"), // daily, weekly, monthly
  startDate: date("start_date").notNull().defaultNow(),
  endDate: date("end_date").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Activity Log ───────────────────────────────────────────────────
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
