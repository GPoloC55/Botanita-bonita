import { getCoupons, saveCoupons } from "../lib/db.mjs";
import { isAuthed, json } from "../lib/common.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const validateCode = url.searchParams.get("validate");

  if (req.method === "GET" && validateCode) {
    const subtotal = Number(url.searchParams.get("subtotal") || 0);
    const coupons = await getCoupons();
    const code = validateCode.trim().toUpperCase();
    const c = coupons.find((x) => x.code.toUpperCase() === code && x.active);
    if (!c) return json({ valid: false });
    if (subtotal < (c.minSubtotal || 0)) return json({ valid: false, reason: "Monto mínimo no alcanzado" });
    let discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
    discount = Math.min(discount, subtotal);
    return json({ valid: true, code: c.code, discount });
  }

  if (!isAuthed(req)) return json({ error: "No autorizado" }, 401);

  if (req.method === "GET") {
    return json({ coupons: await getCoupons() });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const code = (body.code || "").trim().toUpperCase();
      if (!code) return json({ error: "Falta el código" }, 400);
      const coupons = await getCoupons();
      const entry = {
        code,
        type: body.type === "fixed" ? "fixed" : "percent",
        value: Number(body.value) || 0,
        active: body.active !== false,
        minSubtotal: Number(body.minSubtotal) || 0,
      };
      const idx = coupons.findIndex((x) => x.code.toUpperCase() === code);
      if (idx >= 0) coupons[idx] = entry;
      else coupons.push(entry);
      await saveCoupons(coupons);
      return json({ ok: true, coupons });
    } catch (err) {
      return json({ error: "Solicitud inválida" }, 400);
    }
  }

  if (req.method === "DELETE") {
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) return json({ error: "Falta el código" }, 400);
    const coupons = (await getCoupons()).filter((x) => x.code.toUpperCase() !== code);
    await saveCoupons(coupons);
    return json({ ok: true, coupons });
  }

  return json({ error: "Método no permitido" }, 405);
};
