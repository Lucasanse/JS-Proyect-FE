# JS Proyect - Frontend

## Cómo probar la IA y la carga desde el celular

En **Admin → Catálogo → Nuevo producto** hay una caja **"Autocompletar con IA"**: subís hasta 5 fotos del producto (o de su caja o etiqueta) y la IA completa nombre, descripción, categoría, marca, traducción al inglés y los datos de componente de PC. **Precio, stock e imagen los cargás vos.** La IA no guarda nada: revisás los datos y guardás como siempre.

### 1. Elegir el proveedor de IA (en el `.env` del **back**)

| `IA_PROVEEDOR` | Qué hace | Necesita |
|---|---|---|
| `mock` | Devuelve siempre un producto de ejemplo (Ryzen 5 5600). Sirve para probar el formulario sin key y sin gastar. | Nada |
| `gemini` | Analiza las fotos de verdad con Google Gemini (plan gratis, con límite de pedidos por minuto y por día). | `IA_API_KEY` |

Para conseguir la key gratis de Gemini:
1. Entrá a <https://aistudio.google.com> con una cuenta de Google.
2. Tocá **Get API key → Create API key** y copiala (empieza con `AIza`).
3. Pegala en el `.env` del back: `IA_API_KEY=AIza...` y reiniciá el back.

> La key es personal: no la subas al repo ni la pegues en el código.

### 2. Mandar fotos desde el celular

1. Levantá el front con `npm run dev` (ya incluye `--host` para que el celular pueda entrar).
2. En el formulario, tocá **"Usar celular"** y escaneá el QR con la cámara del celular.
3. Sacá o elegí las fotos y tocá **Enviar**. En la computadora aparece "Fotos recibidas" y tocás **"Analizar fotos del celular"**.

Requisitos y problemas comunes:
- **El celular y la computadora tienen que estar en el mismo Wi‑Fi.** En el celular no hay que instalar nada.
- **Firewall de Windows:** la primera vez pregunta si permitir Node.js: aceptá en **redes privadas**. Si tu Wi‑Fi figura como red "Pública", cambiala a "Privada" (Configuración → Red e Internet → Wi‑Fi → la red).
- **El QR abre pero la página no carga:** algunas redes (facultad, trabajo, invitados) bloquean la conexión entre dispositivos. Activá el hotspot del celular y conectá la computadora a ese hotspot.
- **La IP del QR es incorrecta** (pasa con VPN, Docker, WSL o máquinas virtuales): configurá `IP_LOCAL=192.168.x.x` en el `.env` del back con la IP que muestra `ipconfig`.
- El QR vence a los 10 minutos: si vence, generá otro.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
