import { getProducts, saveProducts } from "../lib/db.mjs";
import { isAuthed, json } from "../lib/common.mjs";

export default async (req) => {
  if (req.method === "GET") {
    const products = await getProducts();
    return json({ products });
  }

  if (!isAuthed(req)) {
    return json({ error: "No autorizado" }, 401);
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const products = await getProducts();
      if (body && body.id) {
        const id = Number(body.id);
        const idx = products.findIndex((p) => p.id === id);
        if (idx >= 0) {
          products[idx] = { ...products[idx], ...body, id };
        } else {
          products.push({ ...body, id });
        }
        await saveProducts(products);
        return json({ ok: true, products });
      }
      const id = products.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1;
      products.push({ ...body, id });
      await saveProducts(products);
      return json({ ok: true, products });
    } catch (err) {
      return json({ error: "Solicitud inválida" }, 400);
    }
  }

  if (req.method === "DELETE") {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) return json({ error: "Falta id" }, 400);
    const products = (await getProducts()).filter((p) => p.id !== id);
    await saveProducts(products);
    return json({ ok: true, products });
  }

  return json({ error: "Método no permitido" }, 405);
};
