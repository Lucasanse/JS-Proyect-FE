import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Modal from "../../components/Modal/Modal";
import type { Categoria } from "../../services/productos";
import {
  ApiError,
  MAX_MB_IMAGEN,
  actualizarProducto,
  crearProducto,
  listarMarcas,
  listarTiposComponente,
  subirImagen,
  type MarcaAdmin,
  type ProductoAdmin,
  type ProductoInput,
  type TipoComponente,
} from "../../services/adminProductos";
import Campo from "./Campo";
import Desplegable from "./Desplegable";
import SelectorMarca from "./SelectorMarca";
import SeccionComponente from "./SeccionComponente";
import { claseInput } from "./estilosForm";

interface Props {
  producto: ProductoAdmin | null; // null = alta de un producto nuevo
  categorias: Categoria[];
  onCerrar: () => void;
  onGuardado: (producto: ProductoAdmin) => void;
}

// Todos los campos como texto, tal cual están en los inputs
interface Campos {
  nombre: string;
  idCategoria: string;
  idMarca: string;
  precio: string;
  stock: string;
  descripcion: string;
  imagenUrl: string;
  nombreEn: string;
  descripcionEn: string;
  idTipoComponente: string; // "" = no es un componente de PC
  watts: string;
}

// Claves: nombres de Campos, o "atributo-<id>" para los atributos técnicos
type Errores = Record<string, string | undefined>;
type Valores = Record<number, string>; // idAtributo -> valor

// Props comunes de cada input (ver propsDe)
interface PropsInput {
  id: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  className: string;
}

const camposIniciales = (p: ProductoAdmin | null): Campos => ({
  nombre: p?.nombre ?? "",
  idCategoria: p ? String(p.categoria.id) : "",
  idMarca: p ? String(p.marca.id) : "",
  precio: p ? String(p.precio) : "",
  stock: p ? String(p.stock) : "",
  descripcion: p?.descripcion ?? "",
  imagenUrl: p?.imagenUrl ?? "",
  nombreEn: p?.traduccionEn?.nombre ?? "",
  descripcionEn: p?.traduccionEn?.descripcion ?? "",
  idTipoComponente: p?.componente ? String(p.componente.idTipoComponente) : "",
  watts: p?.componente ? String(p.componente.wattsRequeridos) : "",
});

const valoresIniciales = (p: ProductoAdmin | null): Valores =>
  Object.fromEntries((p?.componente?.atributos ?? []).map((a) => [a.idAtributo, a.valor]));

const esNumeroValido = (v: string) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;

// Mismas reglas que el BE (adminProductos.validation.ts), para avisar antes de enviar
function validar(c: Campos, valores: Valores, tipo: TipoComponente | undefined, t: TFunction): Errores {
  const e: Errores = {};
  const obligatorio = t("admin.form.obligatorio");

  if (!c.nombre.trim()) e.nombre = obligatorio;
  if (!c.idCategoria) e.idCategoria = t("admin.form.elegiCategoria");
  if (!c.idMarca) e.idMarca = t("admin.form.elegiMarca");
  if (!c.descripcion.trim()) e.descripcion = obligatorio;

  const precio = Number(c.precio);
  if (!c.precio.trim()) e.precio = obligatorio;
  else if (!Number.isFinite(precio) || precio <= 0) e.precio = t("admin.form.precioInvalido");
  else if (precio > 99_999_999.99) e.precio = t("admin.form.precioMuyAlto");

  const stock = Number(c.stock);
  if (!c.stock.trim()) e.stock = obligatorio;
  else if (!Number.isInteger(stock) || stock < 0) e.stock = t("admin.form.stockInvalido");

  if (c.imagenUrl.trim() && !/^https?:\/\/\S+$/i.test(c.imagenUrl.trim())) {
    e.imagenUrl = t("admin.form.urlInvalida");
  }

  // La traducción es opcional, pero si se completa un campo hay que completar los dos
  const hayEn = c.nombreEn.trim() || c.descripcionEn.trim();
  if (hayEn && !c.nombreEn.trim()) e.nombreEn = t("admin.form.completaAmbos");
  if (hayEn && !c.descripcionEn.trim()) e.descripcionEn = t("admin.form.completaAmbos");

  // Componente: el consumo es obligatorio; los atributos son opcionales, pero los numéricos tienen que ser números
  if (tipo) {
    const watts = Number(c.watts);
    if (!c.watts.trim()) e.watts = obligatorio;
    else if (!Number.isInteger(watts) || watts < 0 || watts > 2000) e.watts = t("admin.form.consumoInvalido");

    for (const a of tipo.atributos) {
      const valor = valores[a.id]?.trim();
      if (valor && a.numerico && !esNumeroValido(valor)) e[`atributo-${a.id}`] = t("admin.form.numeroInvalido");
    }
  }

  return e;
}

function aInput(c: Campos, valores: Valores, tipo: TipoComponente | undefined): ProductoInput {
  const hayEn = c.nombreEn.trim() && c.descripcionEn.trim();
  return {
    nombre: c.nombre.trim(),
    idCategoria: Number(c.idCategoria),
    idMarca: Number(c.idMarca),
    precio: Number(c.precio),
    stock: Number(c.stock),
    descripcion: c.descripcion.trim(),
    imagenUrl: c.imagenUrl.trim() || null,
    traduccionEn: hayEn ? { nombre: c.nombreEn.trim(), descripcion: c.descripcionEn.trim() } : null,
    // Solo se mandan los atributos del tipo elegido que tienen valor
    componente: tipo
      ? {
          idTipoComponente: tipo.id,
          wattsRequeridos: Number(c.watts),
          atributos: tipo.atributos
            .filter((a) => valores[a.id]?.trim())
            .map((a) => ({ idAtributo: a.id, valor: valores[a.id].trim() })),
        }
      : null,
  };
}

// Pasa los errores por campo del BE (400 con "detalles") a los campos del formulario
function erroresDelBackend(error: ApiError): Errores {
  const traducir: Record<string, string> = {
    "traduccionEn.nombre": "nombreEn",
    "traduccionEn.descripcion": "descripcionEn",
    "componente.idTipoComponente": "idTipoComponente",
    "componente.wattsRequeridos": "watts",
  };
  const e: Errores = {};
  for (const d of error.detalles) {
    const ruta = d.path.slice(0, 2).join(".");
    const clave = traducir[ruta] ?? String(d.path[0]);
    e[clave] ??= d.message;
  }
  return e;
}

export default function ProductoFormModal({ producto, categorias, onCerrar, onGuardado }: Props) {
  const { t } = useTranslation();
  const esNuevo = producto === null;
  const formRef = useRef<HTMLFormElement>(null);
  const [campos, setCampos] = useState(() => camposIniciales(producto));
  const [valores, setValores] = useState(() => valoresIniciales(producto));
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  // Las secciones opcionales arrancan abiertas si el producto ya tiene esos datos
  const [traduccionAbierta, setTraduccionAbierta] = useState(() => !!producto?.traduccionEn);
  const [componenteAbierto, setComponenteAbierto] = useState(() => !!producto?.componente);
  // true si el tipo de componente se eligió solo a partir de la categoría (se puede cambiar)
  const [tipoSugerido, setTipoSugerido] = useState(false);

  // Marcas y tipos de componente para los selects
  const [marcas, setMarcas] = useState<MarcaAdmin[]>([]);
  const [tipos, setTipos] = useState<TipoComponente[]>([]);
  const [datosListos, setDatosListos] = useState(false);
  const [errorDatos, setErrorDatos] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([listarMarcas(controller.signal), listarTiposComponente(controller.signal)])
      .then(([m, tc]) => {
        setMarcas(m);
        setTipos(tc);
        setDatosListos(true);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setErrorDatos(e instanceof Error ? e.message : t("admin.errorGenerico"));
      });
    return () => controller.abort();
  }, [t]);

  const tipo = tipos.find((x) => String(x.id) === campos.idTipoComponente);

  const limpiarError = (clave: string) => {
    if (errores[clave]) setErrores((prev) => ({ ...prev, [clave]: undefined }));
  };

  const cambiar = (campo: keyof Campos, valor: string) => {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
    // El error de un campo se borra apenas se lo corrige
    limpiarError(campo);
  };

  // Al elegir la categoría de un producto nuevo, si esa categoría tiene un único tipo de
  // componente (ej. Procesadores -> CPU), se elige ese tipo. El admin lo puede cambiar.
  const cambiarCategoria = (idCategoria: string) => {
    cambiar("idCategoria", idCategoria);
    if (!esNuevo || (campos.idTipoComponente && !tipoSugerido)) return;
    const candidatos = tipos.filter((x) => x.categorias.includes(Number(idCategoria)));
    const sugerido = candidatos.length === 1 ? String(candidatos[0].id) : "";
    setCampos((prev) => ({ ...prev, idCategoria, idTipoComponente: sugerido }));
    setTipoSugerido(!!sugerido);
    if (sugerido) setComponenteAbierto(true);
  };

  // Props comunes de cada input: valor, cambio y accesibilidad del error
  const propsDe = (campo: keyof Campos): PropsInput => ({
    id: `campo-${campo}`,
    name: campo,
    value: campos[campo],
    onChange: (e) => cambiar(campo, e.target.value),
    "aria-invalid": !!errores[campo],
    "aria-describedby": errores[campo] ? `campo-${campo}-error` : undefined,
    className: claseInput(errores[campo]),
  });

  const mostrarErrores = (nuevos: Errores) => {
    setErrores(nuevos);
    const claves = Object.keys(nuevos).filter((k) => nuevos[k]);
    // Si hay errores dentro de una sección plegada, se abre para que se vean
    if (claves.some((k) => k === "nombreEn" || k === "descripcionEn")) setTraduccionAbierta(true);
    if (claves.some((k) => k === "idTipoComponente" || k === "watts" || k.startsWith("atributo-"))) {
      setComponenteAbierto(true);
    }
    // Se espera un frame para que React pinte los errores antes de buscar el campo
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorGeneral("");
    // Sin los tipos cargados no se puede guardar: se perderían los datos de componente
    if (!datosListos) {
      setErrorGeneral(errorDatos || t("nav.cargando"));
      return;
    }
    const nuevosErrores = validar(campos, valores, tipo, t);
    if (Object.keys(nuevosErrores).length > 0) {
      mostrarErrores(nuevosErrores);
      return;
    }

    setGuardando(true);
    try {
      const datos = aInput(campos, valores, tipo);
      const guardado = esNuevo ? await crearProducto(datos) : await actualizarProducto(producto.id, datos);
      onGuardado(guardado);
    } catch (err) {
      if (err instanceof ApiError && err.detalles.length > 0) mostrarErrores(erroresDelBackend(err));
      setErrorGeneral(err instanceof Error ? err.message : t("admin.errorGenerico"));
    } finally {
      setGuardando(false);
    }
  };

  const ocupado = guardando || subiendoImagen;

  return (
    <Modal
      titulo={esNuevo ? t("admin.form.tituloNuevo") : t("admin.form.tituloEditar")}
      onCerrar={onCerrar}
      bloqueado={guardando}
      ancho="lg"
      cerrarAlClicFuera={false}
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {(errorGeneral || errorDatos) && (
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorGeneral || errorDatos}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <SelectorImagen
              url={campos.imagenUrl}
              error={errores.imagenUrl}
              subiendo={subiendoImagen}
              onSubiendo={setSubiendoImagen}
              onCambiar={(url) => cambiar("imagenUrl", url)}
              onError={(mensaje) => setErrores((prev) => ({ ...prev, imagenUrl: mensaje }))}
              inputProps={propsDe("imagenUrl")}
            />

            <div className="space-y-4">
              <Campo id="campo-nombre" label={t("admin.form.nombre")} error={errores.nombre} requerido>
                <input {...propsDe("nombre")} maxLength={200} data-autofocus />
              </Campo>
              {/* Primero la categoría: según cuál sea, se ordenan las marcas y se sugiere el tipo de componente */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="campo-idCategoria" label={t("admin.form.categoria")} error={errores.idCategoria} requerido>
                  <select {...propsDe("idCategoria")} onChange={(e) => cambiarCategoria(e.target.value)}>
                    <option value="">{t("admin.form.elegi")}</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo id="campo-idMarca" label={t("admin.form.marca")} error={errores.idMarca} requerido>
                  <SelectorMarca
                    id="campo-idMarca"
                    marcas={marcas}
                    idCategoria={campos.idCategoria}
                    value={campos.idMarca}
                    error={errores.idMarca}
                    cargando={!datosListos}
                    onChange={(id) => cambiar("idMarca", id)}
                    onMarcaCreada={(m) =>
                      setMarcas((prev) =>
                        prev.some((x) => x.id === m.id)
                          ? prev
                          : [...prev, m].sort((a, b) => a.nombre.localeCompare(b.nombre)),
                      )
                    }
                  />
                </Campo>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Campo id="campo-precio" label={t("admin.form.precio")} error={errores.precio} requerido>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">$</span>
                    <input
                      {...propsDe("precio")}
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      placeholder="0,00"
                      className={`${propsDe("precio").className} pl-7`}
                    />
                  </div>
                </Campo>
                <Campo id="campo-stock" label={t("admin.form.stock")} error={errores.stock} requerido>
                  <input {...propsDe("stock")} type="number" inputMode="numeric" min="0" step="1" placeholder="0" />
                </Campo>
              </div>
            </div>
          </div>

          <Campo id="campo-descripcion" label={t("admin.form.descripcion")} error={errores.descripcion} requerido>
            <textarea {...propsDe("descripcion")} rows={3} maxLength={5000} />
          </Campo>

          <Desplegable
            titulo={t("admin.form.componente")}
            detalle={tipo ? `· ${tipo.nombre}` : `(${t("admin.form.opcional")})`}
            abierto={componenteAbierto}
            onCambiar={setComponenteAbierto}
          >
            <SeccionComponente
              tipos={tipos}
              cargando={!datosListos}
              idTipo={campos.idTipoComponente}
              watts={campos.watts}
              valores={valores}
              errores={errores}
              sugerido={tipoSugerido}
              onTipo={(id) => {
                cambiar("idTipoComponente", id);
                setTipoSugerido(false);
              }}
              onWatts={(w) => cambiar("watts", w)}
              onValor={(idAtributo, valor) => {
                setValores((prev) => ({ ...prev, [idAtributo]: valor }));
                limpiarError(`atributo-${idAtributo}`);
              }}
            />
          </Desplegable>

          <Desplegable
            titulo={t("admin.form.traduccion")}
            detalle={`(${t("admin.form.opcional")})`}
            abierto={traduccionAbierta}
            onCambiar={setTraduccionAbierta}
          >
            <p className="text-xs text-muted">{t("admin.form.traduccionAyuda")}</p>
            <Campo id="campo-nombreEn" label={t("admin.form.nombreEn")} error={errores.nombreEn}>
              <input {...propsDe("nombreEn")} maxLength={200} lang="en" />
            </Campo>
            <Campo id="campo-descripcionEn" label={t("admin.form.descripcionEn")} error={errores.descripcionEn}>
              <textarea {...propsDe("descripcionEn")} rows={3} maxLength={5000} lang="en" />
            </Campo>
          </Desplegable>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-line bg-surface-alt px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 font-semibold text-ink transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("admin.cancelar")}
          </button>
          <button
            type="submit"
            disabled={ocupado}
            className="cursor-pointer rounded-lg bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando
              ? t("admin.form.guardando")
              : esNuevo
                ? t("admin.form.crear")
                : t("admin.form.guardarCambios")}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

interface SelectorImagenProps {
  url: string;
  error?: string;
  subiendo: boolean;
  onSubiendo: (subiendo: boolean) => void;
  onCambiar: (url: string) => void;
  onError: (mensaje: string) => void;
  inputProps: PropsInput;
}

// Imagen del producto: se sube un archivo (clic o arrastrando) y el BE devuelve la URL.
// También se puede pegar la URL de una imagen que ya esté en internet.
function SelectorImagen({ url, error, subiendo, onSubiendo, onCambiar, onError, inputProps }: SelectorImagenProps) {
  const { t } = useTranslation();
  const inputArchivo = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [rota, setRota] = useState<string | null>(null); // URL que no se pudo mostrar

  const subir = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) return onError(t("admin.form.noEsImagen"));
    if (archivo.size > MAX_MB_IMAGEN * 1024 * 1024) {
      return onError(t("admin.form.imagenPesada", { mb: MAX_MB_IMAGEN }));
    }
    onSubiendo(true);
    try {
      onCambiar(await subirImagen(archivo));
    } catch (e) {
      onError(e instanceof Error ? e.message : t("admin.form.errorImagen"));
    } finally {
      onSubiendo(false);
      if (inputArchivo.current) inputArchivo.current.value = "";
    }
  };

  const hayImagen = !!url.trim() && rota !== url;

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink">{t("admin.form.imagen")}</span>
      <button
        type="button"
        onClick={() => inputArchivo.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          subir(e.dataTransfer.files[0]);
        }}
        disabled={subiendo}
        aria-label={t("admin.form.elegirImagen")}
        className={`relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed bg-surface-alt p-2 text-center text-xs text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-wait ${
          arrastrando ? "border-primary bg-primary-light" : error ? "border-red-500" : "border-line"
        }`}
      >
        {hayImagen ? (
          <img
            src={url}
            alt=""
            onError={() => setRota(url)}
            className="h-full w-full object-contain"
          />
        ) : (
          <>
            <span aria-hidden className="text-3xl">
              🖼️
            </span>
            <span>{rota === url && url ? t("admin.form.imagenRota") : t("admin.form.arrastraImagen")}</span>
          </>
        )}
        {subiendo && (
          <span className="absolute inset-0 flex items-center justify-center bg-surface/80 font-semibold text-primary">
            {t("admin.form.subiendo")}
          </span>
        )}
      </button>
      <input
        ref={inputArchivo}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => subir(e.target.files?.[0])}
      />

      {url && (
        <button
          type="button"
          onClick={() => onCambiar("")}
          disabled={subiendo}
          className="w-full cursor-pointer rounded-lg border border-line px-2 py-1 text-xs font-medium text-muted hover:bg-surface-alt hover:text-primary"
        >
          {t("admin.form.quitarImagen")}
        </button>
      )}

      <label htmlFor={inputProps.id} className="block text-xs text-muted">
        {t("admin.form.oPegaUrl")}
      </label>
      <input {...inputProps} type="url" placeholder="https://..." className={`${inputProps.className} text-xs`} />
      {error && (
        <p id="campo-imagenUrl-error" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
