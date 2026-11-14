import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  actualizarServicio,
  crearPrograma,
  listarServiciosAdmin,
  type GrupoServicio,
  type ServicioAdmin,
} from "../../services/adminServicios";
import { useToast } from "../../components/Toast/toastContext";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import Precio from "../../components/Precio/Precio";
import InputPrecio from "./InputPrecio";

// /admin/servicios: precio de cada servicio y si se ofrece o no. No se agregan servicios nuevos.
// - Armado de PC: se suman en Armá tu PC y se cobran con el carrito.
// - Servicio técnico (tipos, extras y programas): el cliente ve el precio al pedirlo y paga en el local.
// Lo único que se puede agregar son programas para instalar.
const BLOQUES: { grupo: GrupoServicio; clave: string }[] = [
  { grupo: "ARMADOR", clave: "armado" },
  { grupo: "TIPO", clave: "tecnico" },
  { grupo: "EXTRA", clave: "extras" },
  { grupo: "SOFTWARE", clave: "software" },
];
export default function AdminServicios() {
  const { t } = useTranslation();
  const [servicios, setServicios] = useState<ServicioAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listarServiciosAdmin(controller.signal)
      .then((lista) => {
        setServicios(lista);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : t("admin.serv.errorCarga"));
      });
    return () => controller.abort();
  }, [recarga, t]);

  const reemplazar = (servicio: ServicioAdmin) =>
    setServicios((prev) => prev && prev.map((s) => (s.id === servicio.id ? servicio : s)));

  return (
    <section className="w-full">
      <header>
        <h1 className="m-0 text-3xl font-bold text-primary">{t("admin.serv.titulo")}</h1>
        <p className="mt-1 text-muted">{t("admin.serv.subtitulo")}</p>
      </header>

      {BLOQUES.map(({ grupo, clave }) => {
        const delGrupo = servicios?.filter((s) => s.grupo === grupo) ?? [];
        return (
          <Bloque key={grupo} titulo={t(`admin.serv.${clave}.titulo`)}>
            {error ? (
              <ErrorCarga mensaje={error} onReintentar={() => setRecarga((r) => r + 1)} />
            ) : !servicios ? (
              <Esqueleto />
            ) : delGrupo.length === 0 ? (
              <p className="px-4 py-8 text-center text-muted">{t("admin.serv.vacio")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {delGrupo.map((s) => (
                  <li key={s.id}>
                    <FilaServicio servicio={s} onCambiado={reemplazar} />
                  </li>
                ))}
              </ul>
            )}
            {grupo === "SOFTWARE" && servicios && (
              <NuevoPrograma onCreado={(s) => setServicios((prev) => prev && [...prev, s])} />
            )}
          </Bloque>
        );
      })}
    </section>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line bg-surface-alt px-4 py-3">
        <h2 className="text-lg font-bold text-ink">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

// Alta de un programa para instalar: nombre y precio. Queda habilitado.
function NuevoPrograma({ onCreado }: { onCreado: (s: ServicioAdmin) => void }) {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const agregar = async (e: FormEvent) => {
    e.preventDefault();
    const valor = Number(precio);
    if (nombre.trim().length < 2) return setError(t("admin.serv.nuevoPrograma.errorNombre"));
    if (precio === "" || !(valor >= 0)) return setError(t("admin.serv.precioNegativo"));
    setGuardando(true);
    setError("");
    try {
      const creado = await crearPrograma(nombre.trim(), valor);
      onCreado(creado);
      setNombre("");
      setPrecio("");
      mostrarToast(t("admin.serv.nuevoPrograma.toast", { nombre: creado.nombre }), "exito");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.serv.errorGuardar"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={agregar} className="border-t border-line bg-surface-alt/50 px-4 py-3">
      <p className="mb-2 text-sm font-semibold text-ink">{t("admin.serv.nuevoPrograma.titulo")}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <label className="sr-only" htmlFor="nuevo-programa-nombre">
          {t("admin.serv.nuevoPrograma.nombre")}
        </label>
        <input
          id="nuevo-programa-nombre"
          value={nombre}
          maxLength={60}
          onChange={(e) => {
            setNombre(e.target.value);
            setError("");
          }}
          placeholder={t("admin.serv.nuevoPrograma.placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        />
        <label className="sr-only" htmlFor="nuevo-programa-precio">
          {t("admin.serv.nuevoPrograma.precio")}
        </label>
        <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light sm:w-48">
          <span className="pl-3 text-sm text-muted">$</span>
          <InputPrecio
            id="nuevo-programa-precio"
            name="precio"
            value={precio}
            onValor={(v) => {
              setPrecio(v);
              setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "nuevo-programa-error" : undefined}
            className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-ink outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="cursor-pointer rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? t("admin.serv.nuevoPrograma.agregando") : t("admin.serv.nuevoPrograma.agregar")}
        </button>
      </div>
      {error && (
        <p id="nuevo-programa-error" role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}

// Un servicio con su precio (se guarda con el botón) y el switch para ofrecerlo o no en el armador
function FilaServicio({ servicio, onCambiado }: { servicio: ServicioAdmin; onCambiado: (s: ServicioAdmin) => void }) {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const [precio, setPrecio] = useState(String(servicio.precio ?? ""));
  // Reparación y Otro no tienen precio fijo: se presupuestan en el local
  const aPresupuestar = servicio.precio === null;
  // Lo que va al carrito tiene que costar algo; en servicio técnico puede ser 0 (sin cargo)
  const minimo = servicio.grupo === "ARMADOR" ? 0.01 : 0;
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const precioNuevo = Number(precio);
  const cambioPrecio = precio !== "" && precioNuevo !== servicio.precio;
  const idInput = `precio-servicio-${servicio.id}`;

  const guardar = async (cambios: { precio?: number; activo?: boolean }, mensaje: string) => {
    setGuardando(true);
    setError("");
    try {
      const actualizado = await actualizarServicio(servicio.id, cambios);
      onCambiado(actualizado);
      setPrecio(String(actualizado.precio ?? ""));
      mostrarToast(mensaje, "exito");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.serv.errorGuardar"));
    } finally {
      setGuardando(false);
    }
  };

  const guardarPrecio = (e: FormEvent) => {
    e.preventDefault();
    if (!(precioNuevo >= minimo)) {
      setError(t(minimo > 0 ? "admin.serv.precioInvalido" : "admin.serv.precioNegativo"));
      return;
    }
    guardar({ precio: precioNuevo }, t("admin.serv.toastPrecio", { nombre: servicio.nombre }));
  };

  const cambiarActivo = () =>
    guardar(
      { activo: !servicio.activo },
      t(servicio.activo ? "admin.serv.toastDesactivado" : "admin.serv.toastActivado", { nombre: servicio.nombre }),
    );

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${servicio.activo ? "text-ink" : "text-muted"}`}>{servicio.nombre}</p>
        <p className="text-sm text-muted">{servicio.descripcion}</p>
        {aPresupuestar ? (
          <p className="mt-0.5 text-xs text-muted">{t("admin.serv.aPresupuestar")}</p>
        ) : (
          !cambioPrecio && (
            <p className="mt-0.5 text-xs text-muted">
              {t("admin.serv.precioActual")} <Precio precio={servicio.precio ?? 0} className="font-semibold text-ink" />
            </p>
          )
        )}
      </div>

      {!aPresupuestar && (
        <form onSubmit={guardarPrecio} className="flex items-start gap-2 sm:w-48">
          <div className="min-w-0 flex-1">
            <label htmlFor={idInput} className="sr-only">
              {t("admin.serv.precio", { nombre: servicio.nombre })}
            </label>
            <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light">
              <span className="pl-3 text-sm text-muted">$</span>
              <InputPrecio
                id={idInput}
                name="precio"
                value={precio}
                onValor={(v) => {
                  setPrecio(v);
                  setError("");
                }}
                aria-invalid={!!error}
                aria-describedby={error ? `${idInput}-error` : undefined}
                className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-ink outline-none"
              />
            </div>
          </div>
          {cambioPrecio && (
            <button
              type="submit"
              disabled={guardando}
              className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.serv.guardar")}
            </button>
          )}
        </form>
      )}

      <SwitchActivo
        activo={servicio.activo}
        deshabilitado={guardando}
        etiqueta={servicio.nombre}
        onCambiar={cambiarActivo}
      />

      {error && (
        <p id={`${idInput}-error`} role="alert" className="text-sm text-red-700 sm:basis-full">
          {error}
        </p>
      )}
    </div>
  );
}

function SwitchActivo({
  activo,
  deshabilitado,
  etiqueta,
  onCambiar,
}: {
  activo: boolean;
  deshabilitado: boolean;
  etiqueta: string;
  onCambiar: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={t("admin.serv.switchAria", { nombre: etiqueta })}
      disabled={deshabilitado}
      onClick={onCambiar}
      className="flex shrink-0 cursor-pointer items-center gap-2 disabled:cursor-not-allowed sm:w-32"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          activo ? "bg-green-600" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            activo ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className={`text-sm font-medium ${activo ? "text-green-700" : "text-muted"}`}>
        {activo ? t("admin.serv.activo") : t("admin.serv.inactivo")}
      </span>
    </button>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-px" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-surface-alt" />
            <div className="h-3 w-1/2 rounded bg-surface-alt" />
          </div>
          <div className="h-8 w-40 rounded-lg bg-surface-alt" />
          <div className="h-6 w-24 rounded-full bg-surface-alt" />
        </div>
      ))}
    </div>
  );
}
