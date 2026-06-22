"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

interface Product {
  id: string;
  name: string;
  cost: string;
  priceRetail: string;
  priceWholesale: string;
  priceSpecial: string;
  stock: number;
  active?: boolean;
}

interface Client {
  id: string;
  name: string;
  documentNumber: string | null;
}

interface CartItem {
  productId: string;
  name: string;
  cost: number;
  price: number;
  quantity: number;
  subtotal: number;
  profit: number;
}

export default function NewSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<"retail" | "wholesale" | "special">("retail");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit" | "yape" | "plin" | "card">("cash");
  const [clientId, setClientId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Special price modal
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialProduct, setSpecialProduct] = useState<Product | null>(null);
  const [specialPrice, setSpecialPrice] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchClients();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products.filter((p: Product) => p.active));
    }
  };

  const fetchClients = async () => {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients.filter((c: Client) => c.id));
    }
  };

  // Get price depending on sale type
  const getPrice = (product: Product, type: string) => {
    if (type === "wholesale") return parseFloat(product.priceWholesale);
    if (type === "special") return parseFloat(product.priceSpecial);
    return parseFloat(product.priceRetail);
  };

  // Filtered products (search + not in cart)
  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !cart.find((c) => c.productId === p.id)
    )
    .slice(0, 25);

  // Add product to cart
  const addToCart = (product: Product) => {
    if (saleType === "special") {
      // Open modal to enter custom price
      setSpecialProduct(product);
      setSpecialPrice(product.priceSpecial);
      setShowSpecialModal(true);
      setSearchTerm("");
      return;
    }

    const price = getPrice(product, saleType);
    const cost = parseFloat(product.cost);
    setCart([
      ...cart,
      {
        productId: product.id,
        name: product.name,
        cost,
        price,
        quantity: 1,
        subtotal: price,
        profit: price - cost,
      },
    ]);
    setSearchTerm("");
  };

  // Confirm special price
  const confirmSpecialPrice = () => {
    if (!specialProduct) return;

    const customPrice = parseFloat(specialPrice);
    if (!customPrice || customPrice <= 0) {
      alert("Ingresa un precio válido");
      return;
    }

    const cost = parseFloat(specialProduct.cost);
    setCart([
      ...cart,
      {
        productId: specialProduct.id,
        name: specialProduct.name,
        cost,
        price: customPrice,
        quantity: 1,
        subtotal: customPrice,
        profit: customPrice - cost,
      },
    ]);

    setShowSpecialModal(false);
    setSpecialProduct(null);
    setSpecialPrice("");
  };

  // Update quantity
  const updateQuantity = (index: number, qty: number) => {
    const updated = [...cart];
    if (qty < 1) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = qty;
      updated[index].subtotal = updated[index].price * qty;
      updated[index].profit = (updated[index].price - updated[index].cost) * qty;
    }
    setCart(updated);
  };

  // Totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  const totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);
  const total = subtotal;

  // Submit sale
  const handleSubmit = async () => {
    if (cart.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null,
          saleType,
          paymentMethod,
          subtotal,
          tax: 0,
          total,
          totalCost,
          profit: totalProfit,
          notes: notes || null,
          dueDate:
            paymentMethod === "credit"
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
              : null,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
            unitCost: item.cost,
            subtotal: item.subtotal,
            profit: item.profit,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al registrar venta");
      }

      const data = await res.json();

      setSuccess(`✅ Venta #${data.sale.id.slice(0, 8)} registrada correctamente`);
      setCart([]);
      setClientId("");
      setNotes("");
      fetchProducts();

      // Open PDF
      window.open(`/api/sales/${data.sale.id}/pdf`, "_blank");
    } catch (err: any) {
      setError(err.message || "Error al registrar la venta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Venta</h1>
          <p className="text-slate-500 text-sm mt-1">Registro rápido tipo POS</p>
        </div>

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            {success}
            <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-600">✕</button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search + Cart */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex flex-wrap gap-3 mb-4">
                {(["retail", "wholesale", "special"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSaleType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      saleType === type
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {type === "retail" ? "Por Menor" : type === "wholesale" ? "Por Mayor" : "Precio Especial"}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="🔍 Buscar producto por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                autoFocus
              />

              {searchTerm && (
                <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
                  {filteredProducts.length === 0 && (
                    <p className="text-center text-slate-400 py-4 text-sm">No se encontraron productos</p>
                  )}
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={p.stock <= 0}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center transition-colors disabled:opacity-40"
                    >
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-400">Stock: {p.stock}</p>
                      </div>
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        S/ {getPrice(p, saleType).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                Carrito ({cart.length} items)
              </h3>
              {cart.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Agrega productos al carrito</p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">S/ {item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(i, item.quantity - 1)}
                          className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-sm"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(i, item.quantity + 1)}
                          className="w-7 h-7 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white w-20 text-right">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sale Summary */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Detalle de Venta</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cliente (opcional)</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">Cliente general</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["cash", "credit", "yape", "plin", "card"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          paymentMethod === m
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {m === "cash" ? "Efectivo" : m === "credit" ? "Crédito" : m === "yape" ? "Yape" : m === "plin" ? "Plin" : "Tarjeta"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900 dark:text-white font-medium">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ganancia estimada</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">S/ {totalProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-white">TOTAL</span>
                  <span className="text-amber-600 dark:text-amber-400">S/ {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || saving}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
              >
                {saving ? "Registrando..." : "Registrar Venta"}
              </button>
            </div>
          </div>
        </div>

        {/* Special Price Modal */}
        {showSpecialModal && specialProduct && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowSpecialModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm shadow-2xl animate-slide-up">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Precio Especial</h2>
                  <p className="text-sm text-slate-500 mb-4">{specialProduct.name}</p>

                  <div>
                    <label className="block text-sm font-medium mb-1">Precio que vas a cobrar</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-amber-600">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        value={specialPrice}
                        onChange={(e) => setSpecialPrice(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowSpecialModal(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmSpecialPrice}
                      className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm"
                    >
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
