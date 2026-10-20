import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Modal from "../../components/Modal/Modal";
import type { Categoria } from "../../services/productos";
import {
  ApiError,
  MAX_MB_IMAGEN,
  actualizarProducto,
  crearMarca,
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
import AutocompletarIA from "./AutocompletarIA";
import InputPrecio from "./InputPrecio";
import PanelLote from "./PanelLote";
import { estaCerrado, type FotoLote, type ItemLote } from "./lote";
import { IconoImagen } from "./IconosAdmin";
import { claseInput } from "./estilosForm";
import { analizarFotoLote, cancelarCaptura, type SugerenciaProducto } from "../../services/analisisIA";
import { reducirFoto } from "../../services/reducirFoto";

// Si la IA responde 429 (límite de uso), el lote se frena y se reintenta la misma foto tras
// esperar. El BE indica cuánto; si no, se usa ESPERA_LIMITE_S. Pasados los reintentos, queda en error.
const ESPERA_LIMITE_S = 20;
const ESPERA_MAXIMA_S = 60;
const REINTENTOS_LIMITE = 4;

// Espera "segundos" o hasta que se corte el lote (signal)
const esperar = (segundos: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const fin = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", fin);
      resolve();
    };
    const timer = setTimeout(fin, segundos * 1000);
    signal.addEventListener("abort", fin);
  });

interface Props {
  producto: ProductoAdmin | null; // null = alta de un producto nuevo
  categorias: Categoria[];
  onCerrar: () => void;
  // quedanEnLote: en la carga por lote, true si todavía faltan productos (el formulario sigue abierto)
  onGuardado: (producto: ProductoAdmin, quedanEnLote?: boolean) => void;
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

// Lo cargado en un producto de la carga por lote, para retomarlo al volver a él
interface Borrador {
  campos: Campos;
  valores: Valores;
  fotoProducto: File | null;
  marcaNueva: string | null;
  traduccionAbierta: boolean;
  componenteAbierto: boolean;
  tipoSugerido: boolean;
}

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
  // Marca que detectó la IA pero no está cargada: se ofrece agregarla (no se crea sola)
  const [marcaNueva, setMarcaNueva] = useState<string | null>(null);
  const [agregandoMarca, setAgregandoMarca] = useState(false);
  // Foto del lote que se usa como imagen del producto. Se sube recién al guardar,
  // así no quedan archivos sin usar en el servidor si se cancela el alta.
  const [fotoProducto, setFotoProducto] = useState<File | null>(null);
  const vistaFotoProducto = useMemo(() => (fotoProducto ? URL.createObjectURL(fotoProducto) : null), [fotoProducto]);
  useEffect(() => () => {
    if (vistaFotoProducto) URL.revokeObjectURL(vistaFotoProducto);
  }, [vistaFotoProducto]);
  // Las secciones opcionales arrancan abiertas si el producto ya tiene esos datos
  const [traduccionAbierta, setTraduccionAbierta] = useState(() => !!producto?.traduccionEn);
  const [componenteAbierto, setComponenteAbierto] = useState(() => !!producto?.componente);
  // true si el tipo de componente se eligió solo a partir de la categoría (se puede cambiar)
  const [tipoSugerido, setTipoSugerido] = useState(false);

  // Carga por lote: cada foto es un producto. El formulario muestra uno a la vez.
  const [lote, setLote] = useState<ItemLote[] | null>(null);
  const [actual, setActual] = useState(0); // producto del lote que está en el formulario
  // El análisis del lote sigue corriendo entre renders: lo que necesita leer al instante va en refs
  const actualRef = useRef(0);
  const sugerencias = useRef(new Map<number, SugerenciaProducto>());
  const aplicadas = useRef(new Set<number>()); // sugerencias ya volcadas en el formulario
  const cerrados = useRef(new Set<number>()); // guardados o descartados: no se analizan ni se vuelve a ellos
  const borradores = useRef(new Map<number, Borrador>());
  const pedidoLote = useRef<AbortController | null>(null);
  const vistasLote = useRef<string[]>([]);
  const tokenCaptura = useRef<string | null>(null); // QR del celular que el lote sigue usando
  // Al cerrar el formulario se corta el análisis, se libera la captura del BE y las miniaturas
  useEffect(
    () => () => {
      pedidoLote.current?.abort();
      vistasLote.current.forEach((v) => URL.revokeObjectURL(v));
      if (tokenCaptura.current) cancelarCaptura(tokenCaptura.current).catch(() => {});
    },
    [],
  );

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

  // Completa el formulario con lo que sugirió la IA. Solo pisa los campos para los que hay
  // un dato; precio y stock no se tocan. El admin revisa todo antes de guardar.
  // Usa solo setters: la llama el análisis del lote, que puede terminar en otro render.
  const completarConSugerencia = (s: SugerenciaProducto) => {
    setCampos((prev) => ({
      ...prev,
      nombre: s.nombre || prev.nombre,
      descripcion: s.descripcion || prev.descripcion,
      idCategoria: s.idCategoria ? String(s.idCategoria) : prev.idCategoria,
      idMarca: s.idMarca ? String(s.idMarca) : prev.idMarca,
      nombreEn: s.traduccionEn?.nombre ?? prev.nombreEn,
      descripcionEn: s.traduccionEn?.descripcion ?? prev.descripcionEn,
      ...(s.componente && {
        idTipoComponente: String(s.componente.idTipoComponente),
        watts: s.componente.wattsRequeridos !== null ? String(s.componente.wattsRequeridos) : prev.watts,
      }),
    }));
    if (s.componente) {
      setValores(Object.fromEntries(s.componente.atributos.map((a) => [a.idAtributo, a.valor])));
      setTipoSugerido(false);
      setComponenteAbierto(true);
    }
    if (s.traduccionEn) setTraduccionAbierta(true);
    setMarcaNueva(s.idMarca ? null : s.marcaNueva);
    setErrores({});
    setErrorGeneral("");
  };

  const agregarMarcaNueva = async () => {
    if (!marcaNueva) return;
    setAgregandoMarca(true);
    try {
      // Si ya existe con otras mayúsculas, el BE devuelve esa en vez de duplicarla
      const m = await crearMarca(marcaNueva);
      setMarcas((prev) =>
        prev.some((x) => x.id === m.id) ? prev : [...prev, m].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      cambiar("idMarca", String(m.id));
      setMarcaNueva(null);
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : t("admin.errorGenerico"));
    } finally {
      setAgregandoMarca(false);
    }
  };

  // ── Carga por lote ──

  const actualizarItem = (id: number, cambios: Partial<ItemLote>) =>
    setLote((prev) => prev && prev.map((x) => (x.id === id ? { ...x, ...cambios } : x)));

  // Pone en el formulario el producto "id" del lote: lo que ya se le había cargado (si se
  // pasó por él) o un formulario vacío con su foto como imagen. Si la IA ya respondió y
  // todavía no se usó la sugerencia, se completa con ella.
  const cargarItem = (id: number, items: ItemLote[]) => {
    const b = borradores.current.get(id);
    setCampos(b?.campos ?? camposIniciales(null));
    setValores(b?.valores ?? {});
    setFotoProducto(b ? b.fotoProducto : items[id].foto);
    setMarcaNueva(b?.marcaNueva ?? null);
    setTraduccionAbierta(b?.traduccionAbierta ?? false);
    setComponenteAbierto(b?.componenteAbierto ?? false);
    setTipoSugerido(b?.tipoSugerido ?? false);
    setErrores({});
    setErrorGeneral("");
    actualRef.current = id;
    setActual(id);
    const s = sugerencias.current.get(id);
    if (s && !aplicadas.current.has(id)) {
      aplicadas.current.add(id);
      completarConSugerencia(s);
    }
  };

  // Al pasar a otro producto se guarda lo cargado en este, para retomarlo al volver
  const irA = (id: number) => {
    if (!lote) return;
    borradores.current.set(actual, {
      campos,
      valores,
      fotoProducto,
      marcaNueva,
      traduccionAbierta,
      componenteAbierto,
      tipoSugerido,
    });
    cargarItem(id, lote);
  };

  // Analiza un producto. Devuelve los segundos a esperar si la IA llegó a su límite de uso
  // (el producto queda "pausado"), o null si terminó, con sugerencia o con error.
  const analizarItem = async (item: ItemLote, signal: AbortSignal): Promise<number | null> => {
    actualizarItem(item.id, { estado: "analizando", error: "" });
    try {
      const s = await analizarFotoLote(item.foto, item.origen, signal);
      // Si se descartó mientras se analizaba, la sugerencia ya no se usa
      if (cerrados.current.has(item.id)) return null;
      sugerencias.current.set(item.id, s);
      actualizarItem(item.id, { estado: "listo" });
      // Si es el producto que está en pantalla, se completa ya; si no, al ir a él
      if (actualRef.current === item.id && !aplicadas.current.has(item.id)) {
        aplicadas.current.add(item.id);
        completarConSugerencia(s);
      }
      return null;
    } catch (e) {
      if (signal.aborted || cerrados.current.has(item.id)) return null;
      const mensaje = e instanceof Error ? e.message : t("admin.ia.errorAnalisis");
      if (e instanceof ApiError && e.status === 429) {
        actualizarItem(item.id, { estado: "pausado", error: mensaje });
        return Math.min(e.reintentarEn ?? ESPERA_LIMITE_S, ESPERA_MAXIMA_S);
      }
      actualizarItem(item.id, { estado: "error", error: mensaje });
      return null;
    }
  };

  // Analiza un producto y, si la IA está en su límite, espera y reintenta solo. Como el lote
  // se procesa en fila, esperar acá también frena a los productos que vienen después.
  const analizarConReintentos = async (item: ItemLote, signal: AbortSignal) => {
    for (let intento = 0; ; intento++) {
      const espera = await analizarItem(item, signal);
      if (espera === null || signal.aborted || cerrados.current.has(item.id)) return;
      if (intento >= REINTENTOS_LIMITE) return actualizarItem(item.id, { estado: "error" });
      await esperar(espera, signal);
      if (signal.aborted || cerrados.current.has(item.id)) return;
    }
  };

  // Las fotos se analizan de a una, en orden (así no se pasa el límite de pedidos de la IA).
  // Mientras tanto ya se puede ir completando el primer producto.
  const iniciarLote = async (fotos: FotoLote[], token: string | null) => {
    tokenCaptura.current = token;
    const items: ItemLote[] = fotos.map(({ archivo, origen }, id) => ({
      id,
      foto: archivo,
      origen,
      vista: URL.createObjectURL(archivo),
      estado: "esperando",
      error: "",
    }));
    vistasLote.current = items.map((x) => x.vista);
    setLote(items);
    cargarItem(0, items);
    const controller = new AbortController();
    pedidoLote.current = controller;
    for (const item of items) {
      if (controller.signal.aborted) return;
      if (!cerrados.current.has(item.id)) await analizarConReintentos(item, controller.signal);
    }
  };

  const reintentarItem = (id: number) => {
    if (lote && pedidoLote.current) analizarConReintentos(lote[id], pedidoLote.current.signal);
  };

  // Marca el producto actual como guardado o descartado y pasa al siguiente que falte.
  // Devuelve false si ya no queda ninguno.
  const cerrarItemActual = (estado: "guardado" | "descartado") => {
    if (!lote) return false;
    cerrados.current.add(actual);
    borradores.current.delete(actual);
    actualizarItem(actual, { estado });
    const siguiente = [...lote.slice(actual + 1), ...lote.slice(0, actual)].find((x) => !cerrados.current.has(x.id));
    if (!siguiente) return false;
    cargarItem(siguiente.id, lote);
    return true;
  };

  const descartarItem = () => {
    if (!cerrarItemActual("descartado")) onCerrar();
  };

  const pendientesLote = lote ? lote.filter((x) => !estaCerrado(x)).length : 0;

  // Si quedan productos del lote sin guardar, se pide confirmación antes de perderlos
  const cerrar = () => {
    if (pendientesLote > 0 && !window.confirm(t("admin.lote.confirmarCerrar", { count: pendientesLote }))) return;
    onCerrar();
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
      let datos = aInput(campos, valores, tipo);
      // La foto elegida del análisis se sube ahora. Si después falla el guardado, queda
      // como URL en el formulario para no volver a subirla al reintentar.
      if (fotoProducto) {
        const url = await subirImagen(await reducirFoto(fotoProducto));
        setCampos((prev) => ({ ...prev, imagenUrl: url }));
        setFotoProducto(null);
        datos = { ...datos, imagenUrl: url };
      }
      const guardado = esNuevo ? await crearProducto(datos) : await actualizarProducto(producto.id, datos);
      // En la carga por lote el formulario pasa al siguiente producto en vez de cerrarse
      if (lote) onGuardado(guardado, cerrarItemActual("guardado"));
      else onGuardado(guardado);
    } catch (err) {
      if (err instanceof ApiError && err.detalles.length > 0) mostrarErrores(erroresDelBackend(err));
      setErrorGeneral(err instanceof Error ? err.message : t("admin.errorGenerico"));
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar de producto del lote mientras se sube una imagen o se agrega una marca las
  // dejaría en el producto equivocado
  const bloqueadoLote = guardando || subiendoImagen || agregandoMarca;
  const ocupado = bloqueadoLote || lote?.[actual].estado === "analizando";

  return (
    <Modal
      titulo={
        lote
          ? t("admin.lote.tituloModal", { numero: actual + 1, total: lote.length })
          : esNuevo
            ? t("admin.form.tituloNuevo")
            : t("admin.form.tituloEditar")
      }
      onCerrar={cerrar}
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

          {/* Solo en el alta: de 1 a 10 fotos, una por producto, que la IA analiza de a una */}
          {esNuevo && datosListos && !lote && <AutocompletarIA onAnalizarLote={iniciarLote} />}

          {/* Carga por lote: tira con todos los productos; el formulario es el del elegido */}
          {lote && (
            <PanelLote
              items={lote}
              actual={actual}
              bloqueado={bloqueadoLote}
              onElegir={irA}
              onReintentar={reintentarItem}
              onDescartar={descartarItem}
            />
          )}

          {marcaNueva && (
            <div className="flex flex-col gap-2 rounded-lg border border-accent/60 bg-accent/10 px-3 py-2 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
              <span>{t("admin.ia.marcaNueva", { marca: marcaNueva })}</span>
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={agregarMarcaNueva}
                  disabled={agregandoMarca}
                  className="cursor-pointer rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {agregandoMarca ? t("admin.form.guardando") : t("admin.ia.agregarMarca", { marca: marcaNueva })}
                </button>
                <button
                  type="button"
                  onClick={() => setMarcaNueva(null)}
                  className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted hover:text-ink"
                >
                  {t("admin.ia.ignorar")}
                </button>
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <SelectorImagen
              url={campos.imagenUrl}
              vistaPrevia={vistaFotoProducto}
              error={errores.imagenUrl}
              subiendo={subiendoImagen}
              onSubiendo={setSubiendoImagen}
              onCambiar={(url) => {
                // Una imagen subida a mano o una URL reemplazan a la foto elegida del análisis
                cambiar("imagenUrl", url);
                setFotoProducto(null);
              }}
              onError={(mensaje) => setErrores((prev) => ({ ...prev, imagenUrl: mensaje }))}
              inputProps={{
                ...propsDe("imagenUrl"),
                onChange: (e) => {
                  cambiar("imagenUrl", e.target.value);
                  setFotoProducto(null);
                },
              }}
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
                    onChange={(id) => {
                      cambiar("idMarca", id);
                      setMarcaNueva(null);
                    }}
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
                    <InputPrecio
                      {...propsDe("precio")}
                      onValor={(v) => cambiar("precio", v)}
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
            onClick={cerrar}
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
              : lote && pendientesLote > 1
                ? t("admin.lote.crearYSeguir")
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
  vistaPrevia: string | null; // foto del análisis con IA que se sube al guardar
  error?: string;
  subiendo: boolean;
  onSubiendo: (subiendo: boolean) => void;
  onCambiar: (url: string) => void;
  onError: (mensaje: string) => void;
  inputProps: PropsInput;
}

// Imagen del producto: se sube un archivo (clic o arrastrando) y el BE devuelve la URL.
// También se puede pegar la URL de una imagen que ya esté en internet, o usar una de las
// fotos del análisis con IA (vistaPrevia), que se sube recién al guardar el producto.
function SelectorImagen({
  url,
  vistaPrevia,
  error,
  subiendo,
  onSubiendo,
  onCambiar,
  onError,
  inputProps,
}: SelectorImagenProps) {
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
        {vistaPrevia ? (
          <img src={vistaPrevia} alt="" className="h-full w-full object-contain" />
        ) : hayImagen ? (
          <img
            src={url}
            alt=""
            onError={() => setRota(url)}
            className="h-full w-full object-contain"
          />
        ) : (
          <>
            <span className="text-3xl">
              <IconoImagen />
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

      {vistaPrevia && <p className="m-0 text-xs text-muted">{t("admin.form.fotoAlGuardar")}</p>}

      {(url || vistaPrevia) && (
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
