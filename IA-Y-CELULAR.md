# Análisis de productos con IA y carga de fotos desde el celular

Esta función permite cargar de 1 a 10 productos nuevos a partir de fotos, una por producto (del producto, su caja o su etiqueta). La IA analiza cada foto y completa el formulario de ese producto; el admin revisa, carga precio y stock, y guarda uno por uno. También se pueden mandar fotos desde el celular escaneando un QR.

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

Se cargan **de 1 a 10 fotos, cada una de un producto distinto**. Ya no existe el modo de "varias fotos (hasta 5) de un mismo producto": se sacó para dejar un solo flujo.

- **Agregar fotos desde la PC**: botón "Agregar fotos", hasta 10 en total. Si se eligen de más, entran las que caben y aparece un aviso.
- **Usar celular**: crea la sesión, muestra el QR y la URL en texto. El celular acepta hasta 10 fotos, una por producto.
- **Miniaturas**: cada foto muestra "Producto N" y tiene un botón con ícono de cruz para quitarla.
- **Analizar N productos con IA**: le pasa las fotos al formulario, que las analiza de a una (ver sección 3 bis).
- **Sin emojis**: se sacaron los emojis de la caja (título, botones y mensajes). La cruz para quitar foto ahora es un ícono SVG (`IconoCerrar` en `IconosAdmin.tsx`).
- **Mientras el QR está abierto**, cada 2 segundos consulta cuántas fotos llegaron. Si hay nuevas, las descarga y las agrega a la lista. Si la sesión venció (404), cierra el QR y muestra un aviso.
- **Al cerrar el QR** (o el formulario) se envía `DELETE` para invalidar el token. Las fotos ya descargadas siguen en la lista.

### 3. Formulario: `src/pages/Admin/ProductoFormModal.tsx`

- **`completarConSugerencia(sugerencia)`**: completa lo que devolvió la IA sin tocar precio ni stock.
  - Solo cambia los campos para los que hay dato.
  - Si hay componente, cambia tipo, atributos y watts. Si watts es `null`, deja el valor anterior.
  - Si detectó una marca que no existe, muestra el aviso "Agregar marca". Esa acción usa el endpoint de marcas que ya existía.
  - Usa solo setters de estado, porque la llama el análisis del lote, que puede terminar varios renders después.
- **Foto del producto**
  - Cada producto del lote usa su foto como imagen. Se guarda en `fotoProducto` y se muestra con una URL temporal.
  - **No se sube hasta tocar "Crear producto"**. Si cancelás, no queda ningún archivo en el servidor.
  - Si subís una imagen a mano o pegás una URL, reemplaza a la foto.
- **Precio con separador de miles** (`src/pages/Admin/InputPrecio.tsx`): mientras se escribe, el precio se muestra como en Argentina, con punto de miles y coma decimal (`1.234.567,89`), para no confundirse con la cantidad de ceros.
  - El formulario sigue guardando el valor sin formato (`"1234567.89"`), así que la validación y lo que se manda al BE no cambiaron.
  - El input es de texto (`inputMode="decimal"`, así en el celular sale el teclado numérico). Ignora letras y deja hasta 2 decimales y 9 dígitos enteros (con más se ve el error de "precio muy alto").
  - Si el admin escribe un punto al final o pega `1500.50` (sin coma), ese punto se toma como coma decimal. Al borrar no: si de `1.500` se borra un dígito, queda `150`.
  - El cursor se mantiene después del mismo dígito aunque aparezcan o desaparezcan puntos de miles.
  - Al editar un producto, el precio ya aparece formateado (`99.000`).
- **Al guardar**
  - Si hay foto elegida, la reduce con `reducirFoto`, la sube con el endpoint de imágenes que ya existía y usa esa URL.
  - Si el guardado falla después, la URL queda en el formulario y no se vuelve a subir al reintentar.
- **Sin emojis**: el recuadro de imagen vacío ahora muestra un ícono SVG (`IconoImagen`) en lugar del emoji. Lo mismo en la miniatura de la tabla de productos (`AdminProductos.tsx`) y en la cruz de "nueva marca" (`SelectorMarca.tsx`).

### 3 bis. Carga por lote: `ProductoFormModal.tsx`, `PanelLote.tsx` y `lote.ts`

Sirve para dar de alta varios productos de una vez: se cargan de 1 a 10 fotos, **una por producto**, y después se completa cada producto en el mismo formulario, de a uno.

**Cómo se usa**

1. Abrir "Nuevo producto".
2. Agregar de 1 a 10 fotos (desde la PC o el celular). Cada foto tiene que ser de un producto distinto.
3. Tocar **Analizar N productos con IA**. La caja de IA se reemplaza por el panel del lote y el formulario muestra el producto 1.
4. Revisar lo que completó la IA, cargar precio y stock, y tocar **Crear y seguir con el siguiente**. Se guarda y pasa solo al siguiente producto que falte.
5. En el último producto el botón vuelve a decir **Crear producto**. Al guardarlo se cierra el formulario.

**Panel del lote (`PanelLote.tsx`)**

- Una tira con la miniatura de cada producto, su número y su estado:
  - **En espera**: todavía no le tocó a la IA.
  - **Analizando**: la IA la está procesando.
  - **Para revisar**: la IA ya respondió.
  - **Error**: el análisis falló (por ejemplo, IA saturada o límite de uso).
  - **Guardado** / **Descartado**: ya no se puede volver a ese producto.
- Tocando una miniatura se pasa a ese producto. También hay botones **Anterior** y **Siguiente** (saltean los guardados y descartados).
- Arriba muestra "Guardados: N de 10" y, mientras la IA trabaja, "Analizados por la IA: N de 10".
- Debajo de la tira, un recuadro dice qué producto se está completando y qué hacer según su estado.
- **Reintentar análisis**: aparece si la IA falló con ese producto.
- **Descartar este producto**: lo saca del lote (por ejemplo, si la foto salió mal) y pasa al siguiente.
- El título del modal muestra "Nuevo producto 3 de 10".

**Cómo funciona por dentro (`ProductoFormModal.tsx`)**

- **Análisis de a una foto, en orden.** `iniciarLote` recorre las fotos y llama a `analizarFotos([foto])` para cada una, esperando a que termine la anterior. Así no se pasa el límite de pedidos por minuto de Gemini. Mientras tanto ya se puede completar el producto 1.
- **El back no cambió.** Cada análisis es un pedido normal a `POST /api/admin/productos/analizar` con una sola foto, y el celular ya aceptaba 10 fotos por sesión. Por eso el máximo del lote es 10 (`MAX_FOTOS_LOTE` en `analisisIA.ts`).
- **Si la IA responde con el producto en pantalla**, completa el formulario en ese momento (sin tocar precio ni stock). Si responde con otro producto, la sugerencia queda guardada y se aplica al entrar a ese producto. Cada sugerencia se aplica una sola vez, para no pisar lo que corrigió el admin.
- **Borradores.** Al pasar de un producto a otro se guarda lo cargado en el actual (campos, atributos, foto, marca nueva, secciones abiertas). Al volver, se recupera tal cual. Un producto nuevo arranca vacío con su foto como imagen.
- **Al guardar** se usa el mismo `handleSubmit` de siempre (validación, subida de la foto, `crearProducto`). Si sale bien, el producto queda como "Guardado" y el formulario pasa al siguiente. `onGuardado` recibe un segundo parámetro, `quedanEnLote`: si es `true`, `AdminProductos` muestra el aviso y recarga la tabla, pero **no cierra el modal**.
- **Bloqueos**:
  - No se puede guardar un producto mientras la IA lo está analizando.
  - No se puede cambiar de producto mientras se guarda, se sube una imagen o se agrega una marca (si no, el resultado quedaría en el producto equivocado).
- **Al cerrar con productos sin guardar** se pide confirmación ("Quedan N productos del lote sin guardar..."). Los que ya se guardaron quedan guardados.
- **Al cerrar el formulario** se corta el análisis que esté en curso y se liberan las miniaturas.
- **`lote.ts`** tiene el tipo `ItemLote` (id, foto, miniatura, estado y error) y `estaCerrado` (guardado o descartado).

### 4. Página del celular: `src/pages/Captura/Captura.tsx`

Se registró en `src/main.tsx` como ruta `/captura/:token`, fuera del layout (sin navbar ni carrito).

- Al abrir, pide el estado de la sesión. Si no existe o venció, muestra un aviso.
- Dos botones:
  - **Sacar foto**: abre la cámara trasera (`capture="environment"`).
  - **Elegir de la galería**: permite varias fotos.
- **Cada foto se envía apenas se elige**. No hay botón de enviar. Así, si el navegador recarga la página, las fotos ya están en el servidor.
- El texto de ayuda pide **una foto de cada producto**, porque en la PC cada foto pasa a ser un producto distinto.
- Muestra el contador ("Fotos enviadas: N de 10") y miniaturas de lo enviado en esta visita.
- Al llegar al límite, deshabilita los botones.

### 5. Otros cambios

- **`vite.config.ts`**: proxy de `/api` hacia `http://localhost:3000`. El celular habla solo con el puerto 5173, sin problemas de CORS.
- **`package.json`**
  - `dev` ahora es `vite --host`, para exponer el front en la red local.
  - Dependencias nuevas: `qrcode` y `@types/qrcode`.
- **Traducciones** (`es` y `en`): secciones `admin.ia.*`, `admin.lote.*` (carga por lote), `captura.*` y `admin.form.fotoAlGuardar`.
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
5. Toca "Analizar N productos"
   Por cada foto, de a una:
   POST /api/admin/productos/analizar ─► Gemini ─► saneo ─► borrador
   → completa el formulario de ese producto
6. "Crear y seguir con el siguiente" → sube la foto,
   guarda el producto y pasa al siguiente
7. Al cerrar el QR:
   DELETE /api/admin/captura/TOKEN ► borra la sesión
```

**Puntos clave:**

- **El celular no necesita login.** El token de la URL es el permiso: tiene 32 caracteres aleatorios y vence en 10 minutos.
- **El celular nunca habla con la IA.** Solo envía fotos al BE. Quien llama a Gemini es la PC, que tiene el admin logueado.
- **El celular usa la misma URL del front.** Como pasa por el proxy de Vite, no hay que configurar CORS ni puertos extra.
- **Las fotos del celular no se guardan en disco.** Viven en memoria del BE hasta que se cierra el QR, vence la sesión o se reinicia el servidor.
- **La PC decide qué se analiza.** El celular puede enviar hasta 10 fotos. La PC usa hasta 10, una por producto, y cada foto es también la imagen de su producto.

---

## Cosas para tener en cuenta

- **Si reiniciás el back se pierden las fotos del celular**, y hay que generar un QR nuevo. Las sesiones están en memoria, no en la base.
- **El celular necesita el front corriendo** (`npm run dev`, que incluye `--host`), porque la página del QR y el proxy los sirve Vite.
- **Si la IP del QR no es la correcta** (VPN, Docker, WSL), se puede forzar con `IP_LOCAL` en el `.env` del back.
- **`IA_PROVEEDOR` define todo el comportamiento**: `mock` no gasta ni necesita key; `gemini` analiza de verdad y usa `IA_API_KEY`.
- **La key nunca va al front.** Solo la usa el BE, y no debe subirse al repositorio.
