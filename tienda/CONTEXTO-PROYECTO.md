# Botanita Bonita — Contexto del proyecto

Documento de contexto y referencia. Tienda de dulce y botanas.

> Nota de seguridad: este repositorio es **público**. Este archivo **no contiene contraseñas ni secretos**. Las credenciales viven solo en Netlify (Environment variables).

---

## 1. Qué es

Convertir el prototipo original ("Botanita Bonita — Prototipo de tienda.html") en un e-commerce real y fácil de mantener por alguien sin conocimientos técnicos.

- **Fase 1 (actual):** sitio estático + panel de administración + checkout en modo sandbox, desplegado gratis en Netlify. Objetivo: que el cliente lo vea.
- **Fase 2 (futuro):** pagos reales con **Clip** y envíos reales con **Lalamove**.

## 2. Stack

- **Sitio estático** (HTML/CSS/JS, sin framework).
- **Netlify Functions v2** en formato ESM (`.mjs`) para la API.
- **Netlify Blobs** (`@netlify/blobs ^11.1.4`) como almacenamiento de datos (sin base de datos externa).
- **Sin build local.** Netlify compila en la nube; no se necesita Node.js en la computadora.
- Datos guardados en Blobs: `products`, `orders`, `coupons`.

## 3. Estructura de archivos

```
tienda/
├── .gitignore
├── netlify.toml
├── package.json
├── README.md
├── CONTEXTO-PROYECTO.md          ← este archivo
├── netlify/
│   ├── lib/
│   │   ├── db.mjs                Acceso a Blobs (products/orders/coupons)
│   │   └── common.mjs            Utilidades comunes + autenticación HMAC (cookie bb_admin)
│   └── functions/
│       ├── products.mjs          API de productos
│       ├── orders.mjs            API de pedidos (+ envíos)
│       ├── coupons.mjs           API de cupones
│       └── auth.mjs              Login/logout del panel admin
└── public/
    ├── index.html                Tienda (catálogo dinámico + carrito)
    ├── checkout.html             Checkout (sandbox)
    ├── success.html              Confirmación de pedido
    ├── admin.html                Panel de administración (login + tabs)
    └── assets/
        ├── admin.js              Lógica del panel admin
        ├── checkout.js           Lógica del checkout
        └── hero.jpg              Imagen principal
```

## 4. Endpoints de la API

Prefijo público: `/api/…` (redirigido a `/.netlify/functions/:splat`).

| Endpoint | Métodos | Público / Admin |
|---|---|---|
| `/api/products` | GET (público); POST, DELETE (admin) | Ambos |
| `/api/orders` | POST (público); GET, PUT (admin) | Ambos |
| `/api/coupons` | GET `?validate=CODE&subtotal=N` (público); GET, POST, DELETE (admin) | Ambos |
| `/api/auth` | POST `{password}` (login), GET (verifica sesión), DELETE (logout) | Login |

Autenticación: cookie firmada HMAC **`bb_admin`** (HttpOnly, Path=/, SameSite=Lax, Secure, 7 días).

## 5. Modelo de datos

- **Producto:** `{ id, n (nombre), d (descripción), p (precio), c (categoría), e (emoji), bg, t (tag), stock, img }`
- **Pedido:** `{ id, createdAt, items, subtotal, shipping, shippingMethod, discount, coupon, total, customer, status, payment }`

Envíos (definidos en `netlify/functions/orders.mjs`):

```
pickup: 0 | lalamove: 79 | paqueteria: 99
```

Cupón por defecto: `{ code: "BIENVENIDA", type: "percent", value: 10, active: true, minSubtotal: 0 }`.

## 6. Configuración de despliegue

- **Repositorio:** `https://github.com/GPoloC55/Botanita-bonita` (público), rama **`main`**.
- **Estructura del repo:** el contenido del proyecto vive dentro de una carpeta **`tienda/`** en la raíz.
- **Netlify:**
  - Base directory: **`tienda`**
  - Publish directory: **`public`**
  - Functions directory: **`netlify/functions`**
- **URL del sitio:** https://botanita-bonita.netlify.app/
- **Panel admin:** https://botanita-bonita.netlify.app/admin

## 7. Variables de entorno (en Netlify, NO en el repo)

Configuradas en Netlify → Site configuration → Environment variables:

- `ADMIN_PASSWORD` — contraseña del panel admin.
- `AUTH_SECRET` — secreto aleatorio para firmar la cookie de sesión.

> Nunca escribir estos valores en archivos del repositorio (es público).

## 8. Estado actual y pendientes

**Funciona:**
- La tienda principal (`/`) carga correctamente.
- El backend está verificado (vía `curl`): login `POST /api/auth` → 200 + cookie; `GET /api/auth` con cookie → `{authed:true}`; `GET /api/products` → lista de productos.
- `/admin` sirve `admin.html`; `/assets/admin.js` se sirve con `content-type: application/javascript`.

**Pendiente:**
- El login del panel admin "no hace nada" en el navegador (el backend sí funciona; falla del lado del cliente).
- Se endureció `public/assets/admin.js` (sin sintaxis moderna incompatible, con línea de estado visible "Estado: …") y se actualizó `public/admin.html`.
- Falta **subir los 2 archivos actualizados** a GitHub y probar; leer el texto de la línea "Estado: …" para diagnosticar.

## 9. Flujo de trabajo con GitHub Desktop

Rutina para actualizar el sitio (una vez configurado) **sin usar terminal**:

1. Editar los archivos en la carpeta local del repo.
2. Abrir **GitHub Desktop**: aparecerán los cambios detectados.
3. Escribir un mensaje (ej. "Admin: mensajes de estado") y clic **Commit to main**.
4. Clic **Push origin**.
5. Netlify reconstruye solo: pestaña **Deploys** → esperar **Published**.

### Configuración inicial (una sola vez)

1. Instalar **GitHub Desktop** desde `https://desktop.github.com` (gratis, incluye su propio Git).
2. Iniciar sesión con la cuenta **GPoloC55**.
3. **File → Clone repository → GitHub.com** → elegir `GPoloC55/Botanita-bonita`.
4. Elegir "Local path", por ejemplo `~/Documents/GitHub/Botanita-bonita`, y clic **Clone**.
5. Copiar los archivos actualizados más recientes dentro del clon (una vez), luego Commit + Push.

## 10. Buenas prácticas

- **Nunca** subir contraseñas, secretos ni tokens al repositorio (es público).
- Usar **una sola carpeta fuente de verdad**. Recomendado: la carpeta clonada del repo con GitHub Desktop.
- La carpeta `~/Documents/Botanita Bonita/` (con el JPG y el prototipo original) se conserva como **respaldo**.
- Antes de subir cambios con credenciales, revisar que no haya secretos en el texto.
