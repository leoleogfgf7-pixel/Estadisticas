import { db } from "@/db";
import { users, settings, expenseCategories, products, clients, sales, saleItems, inventoryMovements, goals } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if already seeded
  const existingUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(existingUsers[0].count) > 0) {
    console.log("✅ Database already seeded, skipping.");
    process.exit(0);
  }

  // Create admin user
  const adminHash = await hashPassword("admin123");
  const [admin] = await db.insert(users).values({
    name: "Administrador",
    email: "admin@arena.com",
    passwordHash: adminHash,
    role: "admin",
  }).returning({ id: users.id });
  console.log("  ✓ Admin user created (admin@arena.com / admin123)");

  // Create seller user
  const sellerHash = await hashPassword("seller123");
  await db.insert(users).values({
    name: "María Vendedora",
    email: "maria@arena.com",
    passwordHash: sellerHash,
    role: "seller",
  });
  console.log("  ✓ Seller user created");

  // Settings
  await db.insert(settings).values({
    businessName: "ArenaPOS Store",
    currency: "S/",
    primaryColor: "#1e293b",
    secondaryColor: "#f59e0b",
    address: "Av. Principal 123, Lima",
    phone: "+51 999 888 777",
    email: "contacto@arena.com",
    taxRate: "18",
  });
  console.log("  ✓ Settings created");

  // Expense categories
  const cats = await db.insert(expenseCategories).values([
    { name: "Operativos", color: "#64748b" },
    { name: "Compras", color: "#f59e0b" },
    { name: "Servicios", color: "#3b82f6" },
    { name: "Personal", color: "#10b981" },
    { name: "Marketing", color: "#8b5cf6" },
    { name: "Alquiler", color: "#ef4444" },
  ]).returning();
  const [catOps, catCompras, catServ, catPers, catMark, catAlq] = cats;
  console.log("  ✓ Categories created");

  // Products
  const prods = await db.insert(products).values([
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
  ]).returning();
  console.log("  ✓ Products created");

  // Clients
  const clis = await db.insert(clients).values([
    { name: "Juan Pérez", documentType: "DNI", documentNumber: "12345678", phone: "987654321", email: "juan@email.com", type: "frequent" },
    { name: "Ana García", documentType: "DNI", documentNumber: "87654321", phone: "912345678", email: "ana@email.com", type: "wholesale" },
    { name: "Comercial XYZ", documentType: "RUC", documentNumber: "20123456789", phone: "999111222", email: "ventas@xyz.com", type: "wholesale" },
    { name: "Carlos López", documentType: "DNI", documentNumber: "45678901", phone: "955566677", type: "frequent" },
    { name: "María Torres", documentType: "DNI", documentNumber: "34567890", phone: "944455566", email: "maria.t@email.com", type: "frequent" },
  ]).returning();
  console.log("  ✓ Clients created");

  // Goals
  await db.insert(goals).values([
    {
      userId: admin.id,
      title: "Ventas del Mes",
      targetAmount: "15000",
      currentAmount: "8750",
      type: "sales",
      period: "monthly",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
    },
    {
      userId: admin.id,
      title: "Ganancia Neta Mensual",
      targetAmount: "5000",
      currentAmount: "2950",
      type: "profit",
      period: "monthly",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
    },
  ]);
  console.log("  ✓ Goals created");

  // Create some sample sales for the current month
  const now = new Date();
  const days = [1, 3, 5, 7, 8, 10, 12, 14, 15, 16, 18, 20, 21, 22];

  for (const day of days) {
    const saleDate = new Date(now.getFullYear(), now.getMonth(), day, 10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    const product = prods[Math.floor(Math.random() * prods.length)];
    const qty = 1 + Math.floor(Math.random() * 3);
    const clientIdx = Math.random() > 0.3 ? Math.floor(Math.random() * clis.length) : -1;
    const saleType = (["retail", "retail", "retail", "wholesale", "special"] as const)[Math.floor(Math.random() * 5)];
    
    const price = saleType === "wholesale" ? parseFloat(product.priceWholesale)
      : saleType === "special" ? parseFloat(product.priceSpecial)
      : parseFloat(product.priceRetail);
    
    const cost = parseFloat(product.cost);
    const subtotal = price * qty;
    const totalCost = cost * qty;
    const profit = (price - cost) * qty;
    const paymentMethod = (["cash", "cash", "cash", "yape", "plin", "card", "credit"] as const)[Math.floor(Math.random() * 7)];
    const payStatus = paymentMethod === "credit" ? (Math.random() > 0.5 ? "pending" : "partial") : "paid";

    const [sale] = await db.insert(sales).values({
      clientId: clientIdx >= 0 ? clis[clientIdx].id : null,
      userId: admin.id,
      saleType,
      paymentMethod,
      paymentStatus: payStatus,
      subtotal: subtotal.toFixed(2),
      tax: "0",
      total: subtotal.toFixed(2),
      totalCost: totalCost.toFixed(2),
      profit: profit.toFixed(2),
      createdAt: saleDate,
      dueDate: paymentMethod === "credit" ? new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null,
    }).returning({ id: sales.id });

    await db.insert(saleItems).values({
      saleId: sale.id,
      productId: product.id,
      quantity: qty,
      unitPrice: price.toFixed(2),
      unitCost: cost.toFixed(2),
      subtotal: subtotal.toFixed(2),
      profit: profit.toFixed(2),
    });
  }
  console.log(`  ✓ ${days.length} sample sales created`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("   Login: admin@arena.com / admin123");
  console.log("   Login: maria@arena.com / seller123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
