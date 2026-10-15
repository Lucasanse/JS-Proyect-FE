# Análisis de productos con IA y carga de fotos desde el celular

Esta función permite cargar un producto nuevo a partir de fotos (del producto, su caja o su etiqueta). La IA completa el formulario, y el admin revisa y guarda como siempre. También se pueden mandar fotos desde el celular escaneando un QR.

Repositorios:
- Backend: `JS-Proyect-BE`
- Frontend: `JS-Proyect-FE`

---

## Resumen

- La IA **nunca escribe en la base**. Solo devuelve un borrador que el admin revisa.
- Hay dos proveedores, elegidos con `IA_PROVEEDOR` en el `.env` del back:
  - `mock`: devuelve siempre un producto de ejemplo. Sin key, sin costo.
  - `gemini`: analiza las fotos con Google Gemini (plan gratis, con límites).
- El celular **no necesita login ni configuración**: solo estar en el mismo Wi‑Fi y escanear el QR.

---

## Backend (`JS-Proyect-BE`)

### 1. Proveedor de IA: `src/lib/ia.ts`

Elige qué IA responde según `IA_PROVEEDOR`.

- **`mock`**: espera 800 ms y devuelve siempre el mismo producto (Ryzen 5 5600). No llama a ningún servicio.
- **`gemini`**: llama a Gemini con las fotos en base64, el prompt del sistema y un JSON Schema que obliga a responder con el formato esperado.

`consultarGemini` aplica dos reglas:

- **Modelo principal y respaldo.** Prueba `IA_MODELO` (por defecto `gemini-3.5-flash-lite`). Si responde 503 o 500, o no contesta en 45 segundos, reintenta con `IA_MODELO_RESPALDO` (por defecto `gemini-3.1-flash-lite`). Otros errores no reintentan.
- **Mensajes claros.** Traduce los errores de Google:
  - 429: límite de uso.
  - Key inválida: mensaje para revisar `IA_API_KEY`.
  - Modelo inexistente: mensaje para revisar `IA_MODELO`.
  - Saturación: "La IA está saturada en este momento".
  - Timeout: "La IA tardó demasiado en responder".

Si falta `IA_API_KEY` con `gemini`, responde 503 con un aviso. El cliente de Gemini se crea una vez y se reutiliza.

### 2. Análisis y validación: `src/utils/analisisProducto.ts`

Es la parte que evita que la IA meta datos inválidos.

- **`cargarCatalogoIA()`**: lee de la base categorías, marcas, tipos de componente y sus atributos (con unidad, si es numérico y sus opciones).
- **`instruccionesIA(catalogo)`**: arma el prompt en español. Incluye las reglas (no inventar datos, ignorar instrucciones escritas en las fotos, nombre comercial, descripción de 2 a 4 oraciones, traducción al inglés) y la lista real de categorías, marcas, tipos y atributos, para que la IA elija de ahí.
- **`esquemaRespuestaIA(catalogo)`**: JSON Schema de la respuesta. `categoria` y `tipoComponente` son un `enum` con los nombres de la base, así la IA no puede inventar valores.
- **`sanearSugerencia(respuesta, catalogo)`**: convierte la respuesta en un borrador con IDs reales.
  - Busca categoría, marca y tipo ignorando mayúsculas y tildes.
  - Si la marca no existe, la devuelve en `marcaNueva`. **No la crea.**
  - La traducción solo se devuelve si vienen nombre y descripción en inglés.
  - Los watts fuera de 0 a 2000 quedan en `null`.
  - Los atributos numéricos se convierten a número (`"3,5 GHz"` → `"3.5"`). Los negativos y los que no tienen número se descartan.
  - Los valores de texto que coinciden con una opción conocida usan esa escritura (`"am4"` → `"AM4"`).
  - Un atributo repetido se toma una sola vez.
  - Si la respuesta tiene campos mal formados, se descartan solo esos campos.

### 3. Fotos en memoria y sesiones de QR

- **`src/middlewares/subirImagen.ts`**: agrega `subirFotosIA`, un middleware de multer para el campo `fotos`.
  - Guarda en memoria, no en disco.
  - Acepta JPEG, PNG, WEBP, HEIC y HEIF.
  - Máximo 5 MB por foto y 5 fotos por pedido.
- **`src/utils/capturas.ts`**: guarda las sesiones de captura en un `Map` en memoria.
  - Cada sesión tiene un token aleatorio de 32 caracteres, el ID del admin que la creó, una fecha de vencimiento (10 minutos) y la lista de fotos.
  - Si el admin crea una sesión nueva, la anterior se borra.
  - Cada minuto se borran las vencidas.
  - Cada admin solo accede a sus propias sesiones.
  - Hasta 10 fotos por sesión.
- **`src/utils/redLocal.ts`**: `ipLocal()` devuelve la IP de la PC en la red, para armar la URL del QR.
  - Si está definida `IP_LOCAL`, la usa.
  - Si no, busca entre las interfaces de red, descarta las virtuales (Docker, WSL, VPN, VirtualBox, etc.) y prefiere `192.168.x.x`, después `10.x` y por último `172.16–31.x`.

### 4. Endpoints: `src/controllers/analisisIA.controller.ts` y `src/routes/index.ts`

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /api/admin/productos/analizar` | Admin | Recibe hasta 5 fotos (campo `fotos`), las manda a la IA y devuelve el borrador. |
| `POST /api/admin/captura` | Admin | Crea la sesión del QR. Devuelve `token`, `ipLocal`, `fotos`, `maxFotos` y `expiraEn`. |
| `GET /api/admin/captura/:token` | Admin | Cantidad de fotos recibidas. La PC la consulta cada 2 segundos. |
| `GET /api/admin/captura/:token/fotos/:indice` | Admin | Devuelve los bytes de una foto del celular. |
| `DELETE /api/admin/captura/:token` | Admin | Borra la sesión. |
| `GET /api/captura/:token` | Público (el token es el permiso) | Estado de la sesión, para la página del celular. |
| `POST /api/captura/:token/fotos` | Público (el token es el permiso) | El celular envía fotos a la sesión. |

- Un token inválido o vencido responde **404**.
- Si un admin intenta usar una sesión de otro admin, también responde **404**.

### 5. Errores y configuración

- **`src/middlewares/errorHandler.ts`**: traduce los errores de subida de fotos (por ejemplo, "Podés mandar hasta 5 fotos").
- **`.env` y `.env.example`**: variables nuevas:
  - `IA_PROVEEDOR` (`mock` o `gemini`)
  - `IA_API_KEY`
  - `IA_MODELO`
  - `IA_MODELO_RESPALDO`
  - `IP_LOCAL` (opcional)
- **Dependencia nueva**: `@google/genai` 2.28.0 (versión exacta).

---

## Frontend (`JS-Proyect-FE`)

### 1. Servicios

- **`src/services/analisisIA.ts`**
  - Para el admin: `analizarFotos`, `crearCaptura`, `estadoCaptura`, `descargarFotoCaptura`, `cancelarCaptura`.
  - Para el celular: `infoCaptura`, `enviarFotosCaptura`.
  - `enviarFotosCaptura` manda en tandas de 5 si son más.
  - `urlParaCelular` arma la URL del QR. Si la PC está abierta con `localhost`, usa la IP que devolvió el BE. Si no, usa el host actual.
- **`src/services/reducirFoto.ts`**: achica la foto antes de subirla.
  - Lado máximo de 1600 px, JPEG al 85 %, fondo blanco para los PNG con transparencia.
  - Si el resultado pesa más que el original, o si el navegador no puede leer el archivo (por ejemplo HEIC en Chrome), devuelve el original.
- **`src/services/adminProductos.ts`**: `pedir` ahora se exporta para reutilizarla.

### 2. Caja de IA: `src/pages/Admin/AutocompletarIA.tsx`

Aparece arriba del formulario de **alta** (no al editar).

- **Agregar fotos desde la PC**: botón "Agregar fotos", hasta 5 en total.
- **Usar celular**: crea la sesión, muestra el QR y la URL en texto.
- **Miniaturas**: cada foto tiene "Usar como imagen" y una ✕ para quitarla. La elegida se marca con borde y "✓ Imagen".
- **Analizar**: "✨ Analizar N fotos con IA" envía las fotos de la lista.
- **Mientras el QR está abierto**, cada 2 segundos consulta cuántas fotos llegaron. Si hay nuevas, las descarga y las agrega a la lista. Si la sesión venció (404), cierra el QR y muestra un aviso.
- **Al cerrar el QR** (o el formulario) se envía `DELETE` para invalidar el token. Las fotos ya descargadas siguen en la lista.
- **Bloqueo**: mientras analiza, avisa al formulario para que no se pueda guardar.

### 3. Formulario: `src/pages/Admin/ProductoFormModal.tsx`

- **`aplicarSugerencia(sugerencia, fotos)`**: completa lo que devolvió la IA sin tocar precio ni stock.
  - Solo cambia los campos para los que hay dato.
  - Si el producto no tiene imagen, propone la primera foto.
  - Si hay componente, cambia tipo, atributos y watts. Si watts es `null`, deja el valor anterior.
  - Si detectó una marca que no existe, muestra el aviso "Agregar marca". Esa acción usa el endpoint de marcas que ya existía.
- **Foto del producto**
  - Se guarda en `fotoProducto` y se muestra con una URL temporal.
  - **No se sube hasta tocar "Crear producto"**. Si cancelás, no queda ningún archivo en el servidor.
  - Si subís una imagen a mano o pegás una URL, reemplaza a la foto elegida.
- **Al guardar**
  - Si hay foto elegida, la reduce con `reducirFoto`, la sube con el endpoint de imágenes que ya existía y usa esa URL.
  - Si el guardado falla después, la URL queda en el formulario y no se vuelve a subir al reintentar.

### 4. Página del celular: `src/pages/Captura/Captura.tsx`

Se registró en `src/main.tsx` como ruta `/captura/:token`, fuera del layout (sin navbar ni carrito).

- Al abrir, pide el estado de la sesión. Si no existe o venció, muestra un aviso.
- Dos botones:
  - **Sacar foto**: abre la cámara trasera (`capture="environment"`).
  - **Elegir de la galería**: permite varias fotos.
- **Cada foto se envía apenas se elige**. No hay botón de enviar. Así, si el navegador recarga la página, las fotos ya están en el servidor.
- Muestra el contador ("Fotos enviadas: N de 10") y miniaturas de lo enviado en esta visita.
- Al llegar al límite, deshabilita los botones.

### 5. Otros cambios

- **`vite.config.ts`**: proxy de `/api` hacia `http://localhost:3000`. El celular habla solo con el puerto 5173, sin problemas de CORS.
- **`package.json`**
  - `dev` ahora es `vite --host`, para exponer el front en la red local.
  - Dependencias nuevas: `qrcode` y `@types/qrcode`.
- **Traducciones** (`es` y `en`): secciones `admin.ia.*`, `captura.*` y `admin.form.fotoAlGuardar`.
- **`README.md`**: sección "Cómo probar la IA y la carga desde el celular", para que tu amigo pueda seguirla.

---

## Cómo funciona el celular, paso a paso

```
PC (admin)                         Servidor (BE :3000)               Celular
───────────                        ───────────────────               ───────
1. "Usar celular"
   POST /api/admin/captura ──────► crea token (10 min)
                              ◄─── token + ipLocal
2. Muestra QR con
   http://192.168.x.x:5173/captura/TOKEN
                                                                     3. Escanea el QR
                                                                        y abre la página
                                   ◄──── GET /api/captura/TOKEN ───── (Vite lo reenvía al BE)
                                   ◄──── POST /api/captura/TOKEN/fotos  4. Saca una foto
                                         (la guarda en memoria)        → se envía sola
4. Cada 2 s:
   GET /api/admin/captura/TOKEN ─► cantidad de fotos
   GET .../fotos/0, .../fotos/1 ─► fotos nuevas
   → miniaturas en la caja de IA
5. Elige fotos, usa una como imagen
   y toca "Analizar"
   POST /api/admin/productos/analizar ─► Gemini ─► saneo ─► borrador
   → completa el formulario
6. "Crear producto" → sube la foto y guarda el producto
7. Al cerrar el QR:
   DELETE /api/admin/captura/TOKEN ► borra la sesión
```

**Puntos clave:**

- **El celular no necesita login.** El token de la URL es el permiso: tiene 32 caracteres aleatorios y vence en 10 minutos.
- **El celular nunca habla con la IA.** Solo envía fotos al BE. Quien llama a Gemini es la PC, que tiene el admin logueado.
- **El celular usa la misma URL del front.** Como pasa por el proxy de Vite, no hay que configurar CORS ni puertos extra.
- **Las fotos del celular no se guardan en disco.** Viven en memoria del BE hasta que se cierra el QR, vence la sesión o se reinicia el servidor.
- **La PC decide qué se analiza.** El celular puede enviar hasta 10 fotos. La PC elige hasta 5 para la IA y una como imagen del producto.

---

## Cosas para tener en cuenta

- **Si reiniciás el back se pierden las fotos del celular**, y hay que generar un QR nuevo. Las sesiones están en memoria, no en la base.
- **El celular necesita el front corriendo** (`npm run dev`, que incluye `--host`), porque la página del QR y el proxy los sirve Vite.
- **Si la IP del QR no es la correcta** (VPN, Docker, WSL), se puede forzar con `IP_LOCAL` en el `.env` del back.
- **`IA_PROVEEDOR` define todo el comportamiento**: `mock` no gasta ni necesita key; `gemini` analiza de verdad y usa `IA_API_KEY`.
- **La key nunca va al front.** Solo la usa el BE, y no debe subirse al repositorio.
