import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../services/adminProductos";
import {
  DESCRIPCION_OBLIGATORIA,
  LIMITES,
  SISTEMAS_OPERATIVOS,
  SOFTWARE,
  TIPOS_EQUIPO,
  TIPOS_SERVICIO,
  crearSolicitud,
  type SolicitudDetalle,
  type Software,
  type TipoEquipo,
  type TipoServicio,
} from "../../services/servicioTecnico";
import { useToast } from "../../components/Toast/toastContext";
import { IconoEquipo, IconoServicio } from "../../components/ServicioTecnico/IconosServicio";
import { claseInput } from "../Admin/estilosForm";

type Campo = "servicios" | "tipoEquipo" | "software" | "descripcion";
type Errores = Partial<Record<Campo, string>>;

const CAMPOS: Campo[] = ["servicios", "tipoEquipo", "software", "descripcion"];
const PROGRAMAS = SOFTWARE.filter((s) => !SISTEMAS_OPERATIVOS.includes(s));

// Formulario para que el cliente logueado pida un servicio técnico.
// Puede elegir uno o varios servicios (ej. limpieza + formateo + instalación) y según
// lo que elija se piden más datos:
// - Reparación: qué equipo (PC fija, notebook o impresora) y qué le sucede.
// - Limpieza: si quiere que además se cambie la pasta térmica.
// - Formateo: si quiere un backup de sus archivos antes de formatear.
// - Instalación de software: qué programas (un solo Windows).
// - Otro: qué necesita.
// Valida lo mismo que el BE; si el BE igual rechaza algo, el error se muestra en su campo.
export default function NuevaSolicitudForm({ onCreada }: { onCreada: (s: SolicitudDetalle) => void }) {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const [servicios, setServicios] = useState<TipoServicio[]>([]);
  const [tipoEquipo, setTipoEquipo] = useState<TipoEquipo | null>(null);
  const [software, setSoftware] = useState<Software[]>([]);
  const [conBackup, setConBackup] = useState(false);
  const [conPastaTermica, setConPastaTermica] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  // Los errores se muestran recién después del primer intento de envío
  const [intentado, setIntentado] = useState(false);
  const [erroresBE, setErroresBE] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);

  const pide = (s: TipoServicio) => servicios.includes(s);
  const descripcionObligatoria = servicios.some((s) => DESCRIPCION_OBLIGATORIA.includes(s));
  // Qué se pide en el campo de texto según los servicios elegidos
  const tipoTexto = pide("REPARACION") ? "REPARACION" : pide("OTRO") ? "OTRO" : "COMENTARIOS";

  const validar = (): Errores => {
    const e: Errores = {};
    if (servicios.length === 0) e.servicios = t("servicioTecnico.form.errores.servicio");
    if (pide("REPARACION") && !tipoEquipo) e.tipoEquipo = t("servicioTecnico.form.errores.equipo");
    if (pide("INSTALACION_SOFTWARE") && software.length === 0) e.software = t("servicioTecnico.form.errores.software");
    const largo = descripcion.trim().length;
    const { min, max } = LIMITES.descripcion;
    if (descripcionObligatoria && largo === 0)
      e.descripcion = t(`servicioTecnico.form.errores.descripcion${tipoTexto}`);
    else if (descripcionObligatoria && largo < min) e.descripcion = t("servicioTecnico.form.minimo", { count: min });
    else if (largo > max) e.descripcion = t("servicioTecnico.form.maximo", { count: max });
    return e;
  };

  const errores: Errores = { ...(intentado ? validar() : {}), ...erroresBE };

  // Cualquier cambio limpia los errores que había devuelto el BE
  const tocar = () => {
    setErroresBE({});
    setErrorGeneral("");
  };

  const alternarServicio = (tipo: TipoServicio) => {
    tocar();
    setServicios((actual) => (actual.includes(tipo) ? actual.filter((s) => s !== tipo) : [...actual, tipo]));
  };

  const elegirEquipo = (tipo: TipoEquipo) => {
    tocar();
    setTipoEquipo(tipo);
  };

  // Windows 10 y 11 se excluyen: elegir uno reemplaza al otro
  const alternarSoftware = (programa: Software) => {
    tocar();
    setSoftware((actual) => {
      if (actual.includes(programa)) return actual.filter((p) => p !== programa);
      const sinOtroSO = SISTEMAS_OPERATIVOS.includes(programa)
        ? actual.filter((p) => !SISTEMAS_OPERATIVOS.includes(p))
        : actual;
      return [...sinOtroSO, programa];
    });
  };

  const reiniciar = () => {
    setServicios([]);
    setTipoEquipo(null);
    setSoftware([]);
    setConBackup(false);
    setConPastaTermica(false);
    setDescripcion("");
    setIntentado(false);
  };

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault();
    tocar();
    setIntentado(true);
    const errs = validar();
    if (Object.keys(errs).length > 0) {
      document.getElementById(`solicitud-${CAMPOS.find((c) => errs[c])}`)?.focus();
      return;
    }

    setEnviando(true);
    try {
      // Solo se mandan los datos de los servicios elegidos
      const creada = await crearSolicitud({
        servicios,
        ...(pide("REPARACION") && tipoEquipo && { tipoEquipo }),
        ...(pide("INSTALACION_SOFTWARE") && { software }),
        ...(pide("FORMATEO") && { conBackup }),
        ...(pide("LIMPIEZA") && { conPastaTermica }),
        descripcion: descripcion.trim(),
      });
      reiniciar();
      mostrarToast(t("servicioTecnico.form.enviada", { id: creada.id }), "exito");
      onCreada(creada);
    } catch (e) {
      if (e instanceof ApiError && e.detalles.length > 0) {
        const porCampo: Errores = {};
        for (const d of e.detalles) {
          const campo = d.path[0] as Campo;
          if (CAMPOS.includes(campo)) porCampo[campo] ??= d.message;
        }
        setErroresBE(porCampo);
      }
      setErrorGeneral(e instanceof Error ? e.message : t("servicioTecnico.errorGenerico"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <p className="text-sm text-muted">{t("servicioTecnico.form.ayuda")}</p>

      <fieldset className="mt-5" disabled={enviando}>
        <legend id="solicitud-servicios" tabIndex={-1} className="text-base font-bold text-ink">
          {t("servicioTecnico.form.pasoServicio")}
        </legend>
        <p className="mt-1 mb-3 text-sm text-muted">{t("servicioTecnico.form.variosServicios")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TIPOS_SERVICIO.map((tipo) => (
            <Opcion
              key={tipo}
              tipo="checkbox"
              elegida={pide(tipo)}
              onElegir={() => alternarServicio(tipo)}
              icono={<IconoServicio tipo={tipo} />}
              titulo={t(`servicioTecnico.tipos.${tipo}`)}
              ayuda={t(`servicioTecnico.tiposAyuda.${tipo}`)}
            />
          ))}
        </div>
        <ErrorCampo mensaje={errores.servicios} />
      </fieldset>

      {pide("REPARACION") && (
        <fieldset className="mt-6" disabled={enviando}>
          <legend id="solicitud-tipoEquipo" tabIndex={-1} className="mb-3 text-base font-bold text-ink">
            {t("servicioTecnico.form.pasoEquipo")}
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {TIPOS_EQUIPO.map((tipo) => (
              <Opcion
                key={tipo}
                tipo="radio"
                nombre="tipoEquipo"
                elegida={tipoEquipo === tipo}
                onElegir={() => elegirEquipo(tipo)}
                icono={<IconoEquipo tipo={tipo} />}
                titulo={t(`servicioTecnico.equipos.${tipo}`)}
                centrada
              />
            ))}
          </div>
          <ErrorCampo mensaje={errores.tipoEquipo} />
        </fieldset>
      )}

      {pide("LIMPIEZA") && (
        <fieldset className="mt-6" disabled={enviando}>
          <legend className="mb-3 text-base font-bold text-ink">{t("servicioTecnico.form.pasoLimpieza")}</legend>
          <Opcion
            tipo="checkbox"
            elegida={conPastaTermica}
            onElegir={() => {
              tocar();
              setConPastaTermica((p) => !p);
            }}
            titulo={t("servicioTecnico.form.conPastaTermica")}
            ayuda={t("servicioTecnico.form.conPastaTermicaAyuda")}
          />
        </fieldset>
      )}

      {pide("FORMATEO") && (
        <fieldset className="mt-6" disabled={enviando}>
          <legend className="mb-3 text-base font-bold text-ink">{t("servicioTecnico.form.pasoFormateo")}</legend>
          <Opcion
            tipo="checkbox"
            elegida={conBackup}
            onElegir={() => {
              tocar();
              setConBackup((b) => !b);
            }}
            titulo={t("servicioTecnico.form.conBackup")}
            ayuda={t("servicioTecnico.form.conBackupAyuda")}
          />
        </fieldset>
      )}

      {pide("INSTALACION_SOFTWARE") && (
        <fieldset className="mt-6" disabled={enviando}>
          <legend id="solicitud-software" tabIndex={-1} className="mb-3 text-base font-bold text-ink">
            {t("servicioTecnico.form.pasoSoftware")}
          </legend>
          <p className="mb-2 text-sm font-medium text-ink">
            {t("servicioTecnico.form.sistemaOperativo")}{" "}
            <span className="font-normal text-muted">({t("servicioTecnico.form.soloUno")})</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SISTEMAS_OPERATIVOS.map((so) => (
              <Opcion
                key={so}
                tipo="checkbox"
                elegida={software.includes(so)}
                onElegir={() => alternarSoftware(so)}
                titulo={t(`servicioTecnico.software.${so}`)}
              />
            ))}
          </div>
          <p className="mt-4 mb-2 text-sm font-medium text-ink">{t("servicioTecnico.form.programas")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {PROGRAMAS.map((p) => (
              <Opcion
                key={p}
                tipo="checkbox"
                elegida={software.includes(p)}
                onElegir={() => alternarSoftware(p)}
                titulo={t(`servicioTecnico.software.${p}`)}
              />
            ))}
          </div>
          <ErrorCampo mensaje={errores.software} />
        </fieldset>
      )}

      {servicios.length > 0 && (
        <div className="mt-6">
          <label htmlFor="solicitud-descripcion" className="mb-2 block text-base font-bold text-ink">
            {t(`servicioTecnico.form.etiquetaTexto.${tipoTexto}`)}
            {!descripcionObligatoria && (
              <span className="ml-1 text-sm font-normal text-muted">({t("servicioTecnico.form.opcional")})</span>
            )}
          </label>
          <textarea
            id="solicitud-descripcion"
            value={descripcion}
            onChange={(e) => {
              tocar();
              setDescripcion(e.target.value);
            }}
            maxLength={LIMITES.descripcion.max}
            rows={5}
            placeholder={t(`servicioTecnico.form.placeholders.${tipoTexto}`)}
            disabled={enviando}
            aria-invalid={!!errores.descripcion}
            aria-describedby="solicitud-descripcion-ayuda"
            className={`${claseInput(errores.descripcion)} resize-y`}
          />
          <div id="solicitud-descripcion-ayuda" className="mt-1 flex justify-between gap-3 text-sm">
            <span className="text-red-600">{errores.descripcion}</span>
            <span className="shrink-0 text-xs text-muted">
              {descripcion.trim().length}/{LIMITES.descripcion.max}
            </span>
          </div>
        </div>
      )}

      {errorGeneral && (
        <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className="w-full cursor-pointer rounded-lg bg-primary px-6 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {enviando ? t("servicioTecnico.form.enviando") : t("servicioTecnico.form.enviar")}
        </button>
      </div>
    </form>
  );
}

// Tarjeta seleccionable (radio o checkbox). El input real queda oculto pero accesible por teclado.
// Las de checkbox con ícono muestran un tilde en la esquina al elegirlas.
function Opcion({
  tipo,
  nombre,
  elegida,
  onElegir,
  icono,
  titulo,
  ayuda,
  centrada = false,
}: {
  tipo: "radio" | "checkbox";
  nombre?: string;
  elegida: boolean;
  onElegir: () => void;
  icono?: ReactNode;
  titulo: string;
  ayuda?: string;
  centrada?: boolean;
}) {
  return (
    <label
      className={`relative flex h-full cursor-pointer gap-3 rounded-xl border p-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
        centrada ? "flex-col items-center text-center" : "items-start"
      } ${elegida ? "border-primary bg-primary-light" : "border-line bg-surface hover:border-primary"}`}
    >
      <input type={tipo} name={nombre} checked={elegida} onChange={onElegir} className="sr-only" />
      {icono && tipo === "checkbox" && elegida && (
        <span
          aria-hidden
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white"
        >
          ✓
        </span>
      )}
      {icono ? (
        <span className={`text-2xl ${elegida ? "text-primary" : "text-muted"}`}>{icono}</span>
      ) : (
        <span
          aria-hidden
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
            elegida ? "border-primary bg-primary text-white" : "border-line bg-surface"
          }`}
        >
          {elegida && "✓"}
        </span>
      )}
      <span className={`min-w-0 ${icono && tipo === "checkbox" ? "pr-5" : ""}`}>
        <span className={`block text-sm font-semibold ${elegida ? "text-primary" : "text-ink"}`}>{titulo}</span>
        {ayuda && <span className="mt-0.5 block text-xs text-muted">{ayuda}</span>}
      </span>
    </label>
  );
}

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-600">
      {mensaje}
    </p>
  );
}
