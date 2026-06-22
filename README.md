# Mi Negocio - Sistema de Gestión de Ventas

Sistema profesional de gestión de ventas, inventario, clientes y finanzas.

## ✅ Características

- **Ventas (POS)**: Registro rápido con 3 tipos de precio (Menor, Mayor, Especial)
- **Precio Especial**: Modal para ingresar el precio exacto que quieres cobrar
- **Anular ventas**: Devuelve el stock automáticamente
- **Estadísticas**: Ventas Hoy / Semana / Mes + Ganancia Bruta / Neta
- **Inventario**: Control de stock con alertas
- **Clientes**: CRM con tipo (Frecuente / Mayorista)
- **Créditos**: Ventas fiadas y control de pagos
- **Gastos**: Registro por categorías
- **Backup**: Exportar / Restaurar / Reiniciar datos
- **PDF**: Comprobantes automáticos
- **Excel**: Exportación de ventas

## 🚀 Desplegar en Vercel (sin errores)

### Opción 1 - Desde GitHub (recomendado)

1. Sube este proyecto a un repositorio en GitHub
2. Ve a [vercel.com/new](https://vercel.com/new)
3. Importa tu repositorio
4. Click en **Deploy**
5. ¡Listo! No necesitas configurar nada más

### Opción 2 - Con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel --prod
```

### Variables de entorno

**No necesitas ninguna variable de entorno.**

El sistema funciona 100% sin base de datos externa.

---

## 📋 Funcionamiento

### Primera vez (vacío)
- El dashboard muestra un panel de bienvenida
- Acciones rápidas: Nueva Venta, Agregar Producto, Agregar Cliente, Configurar

### Registrar una venta
1. Ve a **Nueva Venta**
2. Elige el tipo de precio:
   - **Por Menor** → usa `priceRetail`
   - **Por Mayor** → usa `priceWholesale`
   - **Precio Especial** → abre modal para escribir el precio que quieres cobrar
3. Busca y agrega productos al carrito
4. Elige cliente (opcional) y método de pago
5. Click en **Registrar Venta**
6. Se genera el PDF automáticamente

### Anular una venta
- Ve a **Ventas**
- Click en **🗑️ Anular**
- El stock se devuelve automáticamente

### Backup de datos
- Ve a **Configuración → Backup**
- **Exportar**: Descarga un archivo JSON con todos tus datos
- **Restaurar**: Sube un backup anterior
- **Reiniciar**: Borra todo y empieza de cero

---

## 🛠️ Estructura

```
src/
├── app/
│   ├── api/           # 18 endpoints REST
│   ├── sales/         # Historial + Nueva Venta (POS)
│   ├── products/      # Gestión de Stock
│   ├── clients/       # CRM
│   ├── credits/       # Deudas y pagos
│   ├── expenses/      # Gastos
│   ├── statistics/    # Reportes avanzados
│   ├── inventory/     # Movimientos de stock
│   ├── goals/         # Metas
│   ├── settings/      # Config + Backup
│   └── page.tsx       # Dashboard con estadísticas
├── lib/
│   ├── store.ts       # Almacenamiento en memoria (Vercel compatible)
│   ├── auth.ts        # Autenticación sin login requerido
│   ├── pdf.ts         # Generación de comprobantes
│   └── excel.ts       # Exportación a Excel
└── components/
    ├── Sidebar.tsx
    ├── AppLayout.tsx
    └── KpiCard.tsx
```

---

## 📞 Soporte

La aplicación está lista para producción.
Todo funciona sin base de datos externa.

**¡Disfruta gestionando tu negocio!** 🎉
