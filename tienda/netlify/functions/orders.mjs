import { getProducts, getOrders, saveOrders, getCoupons } from "../lib/db.mjs";
import { isAuthed, json } from "../lib/common.mjs";

const SHIPPING = { pickup: 0, lalamove: 79, paqueteria: 99 };

export default async (req) => {
  if (req.method === "GET") {
    if (!isAuthed(req)) return json({ error: "No autorizado" }, 401);
    return json({ orders: await getOrders() });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (!body || !Array.isArray(body.items) || !body.items.length) {
        return json({ error: "Carrito vacío" }, 400);
      }
      const products = await getProducts();
      const items = [];
      let subtotal = 0;
      for (const it of body.items) {
        const p = products.find((x) => x.id === Number(it.id));
        if (!p) continue;
        const qty = Math.max(1, parseInt(it.qty) || 1);
        subtotal += p.p * qty;
        items.push({ id: p.id, n: p.n, p: p.p, qty });
      }
      if (!items.length) return json({ error: "Productos no válidos" }, 400);
      const method = SHIPPING[body.delivery?.method] !== undefined ? body.delivery.method : "pickup";
      const shipping = subtotal > 0 ? SHIPPING[method] : 0;
      let discount = 0, coupon = null;
      const code = (body.coupon || "").trim().toUpperCase();
      if (code) {
        const coupons = await getCoupons();
        const c = coupons.find((x) => x.code.toUpperCase() === code && x.active);
        if (c && subtotal >= (c.minSubtotal || 0)) {
          discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
          discount = Math.min(discount, subtotal);
          coupon = c.code;
        }
      }
      const total = Math.max(0, subtotal + shipping - discount);
      const orders = await getOrders();
      const id = "BB-" + Date.now().toString(36).toUpperCase();
      const order = {
        id, createdAt: new Date().toISOString(),
        items, subtotal, shipping, shippingMethod: method,
        discount, coupon, total, customer: body.customer || {},
        status: "pendiente", payment: "sandbox",
      };
      orders.unshift(order);
      await saveOrders(orders);
      return json({ ok: true, orderId: id, total, order });
    } catch (err) {
      return json({ error: "Solicitud inválida" }, 400);
    }
  }

  if (req.method === "PUT") {
    if (!isAuthed(req)) return json({ error: "No autorizado" }, 401);
    try {
      const body = await req.json();
      const orders = await getOrders();
      const o = orders.find((x) => x.id === body.id);
      if (!o) return json({ error: "Pedido no encontrado" }, 404);
      if (body.status) o.status = body.status;
      await saveOrders(orders);
      return json({ ok: true, orders });
    } catch (err) {
      return json({ error: "Solicitud inválida" }, 400);
    }
  }

  return json({ error: "Método no permitido" }, 405);
};
