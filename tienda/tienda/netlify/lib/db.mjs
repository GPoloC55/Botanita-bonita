import { getStore } from "@netlify/blobs";

const STORE = "botanita";

// Catálogo inicial (se usa la primera vez que se abre el panel)
export const DEFAULT_PRODUCTS = [
  { id: 1, n: "Barrita de Zanahoria", d: "Dulce y crujiente", p: 35, c: "Barritas", e: "🥕", bg: "#ffe3c7", t: "Favorita", stock: 50, img: "" },
  { id: 2, n: "Barrita de Betabel", d: "Con toque de manzana", p: 38, c: "Barritas", e: "🟣", bg: "#f3d6f5", t: "", stock: 40, img: "" },
  { id: 3, n: "Barrita de Brócoli", d: "Con queso y limón", p: 38, c: "Barritas", e: "🥦", bg: "#d9f0c6", t: "Nuevo", stock: 30, img: "" },
  { id: 4, n: "Barrita de Jitomate", d: "Sabor pizza, sin culpa", p: 36, c: "Barritas", e: "🍅", bg: "#ffd6d1", t: "", stock: 25, img: "" },
  { id: 5, n: "Caja Mixta x6", d: "Una de cada sabor", p: 199, c: "Cajas", e: "🎁", bg: "#d6ecff", t: "Ahorra 15%", stock: 20, img: "" },
  { id: 6, n: "Caja Fiesta x12", d: "Ideal para escuela u oficina", p: 379, c: "Cajas", e: "🎉", bg: "#fff1b8", t: "", stock: 15, img: "" },
  { id: 7, n: "Playera Osito Arcoíris", d: "Talla infantil y adulto", p: 249, c: "Regalos", e: "🧸", bg: "#fde0ef", t: "", stock: 10, img: "" },
];

const DEFAULT_COUPONS = [
  { code: "BIENVENIDA", type: "percent", value: 10, active: true, minSubtotal: 0 },
];

function store() {
  return getStore(STORE);
}

async function read(key, fallback) {
  try {
    const value = await store().get(key, { type: "json" });
    return value ?? fallback;
  } catch (err) {
    console.error("Blobs read error:", key, err.message);
    return fallback;
  }
}

async function write(key, value) {
  await store().set(key, JSON.stringify(value));
  return value;
}

export async function getProducts() {
  let list = await read("products", null);
  if (!Array.isArray(list) || list.length === 0) {
    list = DEFAULT_PRODUCTS;
    await write("products", list);
  }
  return list;
}

export async function saveProducts(list) {
  return write("products", list);
}

export async function getOrders() {
  return read("orders", []);
}

export async function saveOrders(list) {
  return write("orders", list);
}

export async function getCoupons() {
  let list = await read("coupons", null);
  if (!Array.isArray(list)) {
    list = DEFAULT_COUPONS;
    await write("coupons", list);
  }
  return list;
}

export async function saveCoupons(list) {
  return write("coupons", list);
}
