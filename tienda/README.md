# Botanita Bonita — Tienda web (Fase 1)

Esta es la versión de Fase 1 lista para desplegarse en **Netlify**: sitio estático + panel de administración + checkout sandbox + pedidos guardados en Netlify Blobs (sin base de datos externa).

## Estructura
- `public/` — Frontend estático (HTML, CSS, JS, imágenes)
- `netlify/functions/` — API serverless (products, orders, coupons, auth)
- `netlify/lib/` — Helpers comunes (Blobs + auth)
- `package.json`, `netlify.toml` — Configuración Netlify

## Despliegue gratuito en Netlify

1. Sube este proyecto a un repositorio en GitHub (puedes usar `git init`, `add`, `commit` y `push`).
2. En [netlify.com](https://app.netlify.com), selecciona "Add new site → Import an existing project" y conecta tu repo.
3. Netlify detectará la configuración automáticamente (`publish: public`, funciones en `netlify/functions`).
4. En "Site configuration → Environment variables", agrega (recomendado):
   - `ADMIN_PASSWORD` — contraseña para acceder a `/admin` (ej. `your-password-here`)
   - `AUTH_SECRET` — una cadena aleatoria para firmar las cookies del admin
5. Dale "Deploy site". En unos segundos tendrás la URL pública.

## Acceso al panel admin
Ve a `https://TU-SITIO.netlify.app/admin` y entra con tu `ADMIN_PASSWORD`.

Desde el panel puedes:
- Añadir/editar/borrar productos (precio, stock, foto, categoría, etiqueta)
- Ver y cambiar estado de pedidos (pendiente/pagado/enviado/entregado/cancelado)
- Crear/editar/borrar cupones

## Datos guardados
- Productos, pedidos y cupones se guardan en **Netlify Blobs** (asociados a este sitio). Cada edición desde el admin se persiste.
- Los productos del catálogo inicial se sembrarán automáticamente la primera vez que se acceda a la API o al panel.
- El checkout funciona en **modo sandbox**: guarda el pedido en el panel, no cobra. En la **Fase 2** conectaremos Clip y Lalamove.

## Pruebas locales (opcional)
Necesitarías `netlify-cli` (requiere Node.js). En este entorno no lo instalamos; el despliegue directo desde Git es suficiente.

## Notas
- La contraseña por defecto para admin es `your-password-here`. Cámbiala en Environment Variables antes de que el cliente uselo.
- Netlify Blobs tiene límite gratuito razonable para una demo/tienda pequeña. Para producción con mucho tráfico, revisar límites de Netlify.
- Las imágenes subidas desde el admin se guardan como dataURL en el JSON (práctico para Fase 1). Si crecen mucho, conviene cambiar a almacenamiento de imágenes.
- En Fase 2 agregaremos: llamada real a Clip (API + webhook), cotización/pedido Lalamove, descuentos más avanzados, correos/WhatsApp.
