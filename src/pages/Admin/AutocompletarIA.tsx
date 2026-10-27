import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";

import { ApiError } from "../../services/adminProductos";
import {
  MAX_FOTOS_LOTE,
  cancelarCaptura,
  cerrarCaptura,
  crearCaptura,
  descargarFotoCaptura,
  estadoCaptura,
  urlParaCelular,
  type CapturaCreada,
  type OrigenFoto,
} from "../../services/analisisIA";
import { IconoCerrar } from "./IconosAdmin";
import type { FotoLote } from "./lote";

interface Props {
  // Una foto por producto. tokenCaptura: el QR sigue abierto; pasa a ser responsabilidad
  // del formulario, que lo cierra al terminar (el análisis usa las fotos que guarda el BE).
  onAnalizarLote: (fotos: FotoLote[], tokenCaptura: string | null) => void;
}

interface Foto {
  id: number;
  archivo: File;
  origen?: OrigenFoto; // si llegó del celular, dónde la tiene el BE
  vista: string; // object URL para la miniatura
}

const CONSULTA_CADA_MS = 2000;

const boton =
  "cursor-pointer rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

// Caja del formulario de alta: se juntan de 1 a 10 fotos, cada una de un producto distinto
// (desde la computadora o desde el celular escaneando un QR). Al analizar se le pasan al
// formulario, que las manda a la IA de a una y deja completar cada producto por separado.
export default function AutocompletarIA({ onAnalizarLote }: Props) {
  const { t } = useTranslation();
  const inputFotos = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [error, setError] = useState("");
  const [creandoQr, setCreandoQr] = useState(false);
  const [captura, setCaptura] = useState<CapturaCreada | null>(null);
  const [qr, setQr] = useState({ url: "", imagen: "" });
  const [fotosCelular, setFotosCelular] = useState(0);
  const [iniciando, setIniciando] = useState(false); // cerrando el QR antes de analizar

  // Copia de "fotos" que se actualiza al instante (el estado tarda un render): la usan
  // la descarga de fotos del celular, que corre fuera del render, y la limpieza final.
  const fotosActuales = useRef<Foto[]>([]);
  const siguienteId = useRef(0);
  const descargadas = useRef(0); // fotos del celular ya traídas a la computadora
  const entregada = useRef(false); // la captura pasó al formulario: no hay que cancelarla acá

  const actualizarFotos = (nuevas: Foto[]) => {
    fotosActuales.current = nuevas;
    setFotos(nuevas);
  };

  // Al cerrar el formulario se liberan las miniaturas
  useEffect(
    () => () => {
      fotosActuales.current.forEach((f) => URL.revokeObjectURL(f.vista));
    },
    [],
  );

  const agregar = useCallback(
    (archivos: File[], origen?: OrigenFoto) => {
      const lugar = MAX_FOTOS_LOTE - fotosActuales.current.length;
      if (archivos.length > lugar)
        setError(t("admin.ia.loteLleno", { max: MAX_FOTOS_LOTE }));
      else setError("");
      const nuevas = archivos
        .slice(0, Math.max(lugar, 0))
        .map((archivo) => ({ id: siguienteId.current++, archivo, origen, vista: URL.createObjectURL(archivo) }));
      if (nuevas.length === 0) return;
      fotosActuales.current = [...fotosActuales.current, ...nuevas];
      setFotos(fotosActuales.current);
    },
    [t],
  );

  const quitar = (foto: Foto) => {
    URL.revokeObjectURL(foto.vista);
    actualizarFotos(fotosActuales.current.filter((f) => f.id !== foto.id));
    setError("");
  };

  // Trae las fotos del celular que todavía no se descargaron, hasta "total". Las llamadas
  // se encolan: el polling y el cierre final pueden coincidir sin bajar una foto dos veces.
  const cola = useRef<Promise<void>>(Promise.resolve());
  const traerPendientes = useCallback(
    (token: string, total: number, signal?: AbortSignal) => {
      const tarea = cola.current.then(async () => {
        while (descargadas.current < total) {
          const indice = descargadas.current;
          const archivo = await descargarFotoCaptura(token, indice, signal);
          descargadas.current++;
          agregar([archivo], { token, indice });
        }
      });
      cola.current = tarea.catch(() => {});
      return tarea;
    },
    [agregar],
  );

  // Mientras se muestra el QR, cada 2 segundos se consulta si llegaron fotos del celular
  // y se descargan las nuevas para mostrarlas acá
  useEffect(() => {
    if (!captura) return;
    const controller = new AbortController();
    let consultando = false;
    const consultar = async () => {
      if (consultando) return;
      consultando = true;
      try {
        const estado = await estadoCaptura(captura.token, controller.signal);
        setFotosCelular(estado.fotos);
        await traerPendientes(captura.token, estado.fotos, controller.signal);
      } catch (e) {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 404) {
          setCaptura(null);
          setError(t("admin.ia.qrVencido"));
        }
      } finally {
        consultando = false;
      }
    };
    const intervalo = setInterval(consultar, CONSULTA_CADA_MS);
    return () => {
      clearInterval(intervalo);
      controller.abort();
    };
  }, [captura, traerPendientes, t]);

  // Al cerrar el QR (o el formulario) se descarta la captura en el BE
  useEffect(() => {
    if (!captura) return;
    return () => {
      if (!entregada.current) cancelarCaptura(captura.token).catch(() => {});
    };
  }, [captura]);

  const elegirFotos = (lista: FileList | null) => {
    const archivos = [...(lista ?? [])];
    if (inputFotos.current) inputFotos.current.value = "";
    if (archivos.some((a) => !a.type.startsWith("image/")))
      return setError(t("admin.form.noEsImagen"));
    agregar(archivos);
  };

  const usarCelular = async () => {
    setError("");
    setCreandoQr(true);
    try {
      const nueva = await crearCaptura();
      const url = urlParaCelular(nueva);
      setQr({
        url: url ?? "",
        imagen: url
          ? await QRCode.toDataURL(url, { width: 220, margin: 1 })
          : "",
      });
      descargadas.current = 0;
      setFotosCelular(0);
      setCaptura(nueva);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.errorGenerico"));
    } finally {
      setCreandoQr(false);
    }
  };

  // Si hay un QR abierto, primero se lo cierra para que el celular no siga mandando fotos
  // que nadie recibiría, y se bajan las que llegaron desde la última consulta. Después el
  // lote pasa al formulario, que se queda con la captura para analizar las fotos del celular.
  const iniciarAnalisis = async () => {
    setIniciando(true);
    let tokenCaptura: string | null = null;
    if (captura) {
      try {
        const estado = await cerrarCaptura(captura.token);
        await traerPendientes(captura.token, estado.fotos);
        tokenCaptura = captura.token;
      } catch {
        // El QR venció o se cortó la conexión: se analiza lo que ya está en la grilla
      }
    }
    entregada.current = tokenCaptura !== null;
    onAnalizarLote(
      fotosActuales.current.map((f) => ({ archivo: f.archivo, origen: f.origen })),
      tokenCaptura,
    );
  };

  const llena = fotos.length >= MAX_FOTOS_LOTE;

  return (
    <section className="space-y-3 rounded-xl border border-primary/40 bg-primary-light/40 p-4">
      <div>
        <h3 className="m-0 text-sm font-bold text-ink">
          {t("admin.ia.titulo")}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {t("admin.ia.ayudaLote", { max: MAX_FOTOS_LOTE })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputFotos.current?.click()}
          disabled={llena}
          className={boton}
        >
          {t("admin.ia.agregarFotos")}
        </button>
        {!captura && (
          <button
            type="button"
            onClick={usarCelular}
            disabled={creandoQr}
            className={boton}
          >
            {creandoQr ? t("nav.cargando") : t("admin.ia.usarCelular")}
          </button>
        )}
        <input
          ref={inputFotos}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(e) => elegirFotos(e.target.files)}
        />
      </div>

      {captura && (
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-3 sm:flex-row sm:items-center">
          {qr.imagen && (
            <img
              src={qr.imagen}
              alt={t("admin.ia.qrAlt")}
              width={160}
              height={160}
              className="mx-auto shrink-0 sm:mx-0"
            />
          )}
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            {qr.url ? (
              <>
                <p className="m-0 text-ink">{t("admin.ia.qrAyuda")}</p>
                <p className="m-0 break-all rounded bg-surface-alt px-2 py-1 font-mono text-xs text-muted select-all">
                  {qr.url}
                </p>
              </>
            ) : (
              <p className="m-0 text-red-700">{t("admin.ia.qrSinIp")}</p>
            )}
            <p className="m-0 font-semibold text-ink" aria-live="polite">
              {t("admin.ia.fotosRecibidas", { cantidad: fotosCelular })}
            </p>
            <button
              type="button"
              onClick={() => setCaptura(null)}
              className={boton}
            >
              {t("admin.ia.cerrarQr")}
            </button>
          </div>
        </div>
      )}

      {fotos.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-5">
          {fotos.map((f, i) => (
            <li
              key={f.id}
              className="relative overflow-hidden rounded-lg border-2 border-line bg-surface"
            >
              <img
                src={f.vista}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => quitar(f)}
                aria-label={t("admin.ia.quitarFoto")}
                className="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                <IconoCerrar />
              </button>
              <span className="block bg-surface-alt px-1 py-1 text-center text-[11px] font-semibold text-ink">
                {t("admin.lote.producto", { numero: i + 1 })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {fotos.length > 0 && (
        <button
          type="button"
          onClick={iniciarAnalisis}
          disabled={iniciando}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("admin.ia.analizarLote", { count: fotos.length })}
        </button>
      )}

      {error && (
        <p role="alert" className="m-0 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
