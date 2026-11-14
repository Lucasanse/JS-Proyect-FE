import { useTranslation } from "react-i18next";
import Modal from "../../components/Modal/Modal";
import Precio from "../../components/Precio/Precio";
import type { ProductoArmador } from "../../services/armador";
import { plataformaDe, useTextosArmador } from "./textosArmador";

// Resumen de un producto del armador: la foto grande, la descripción y las especificaciones.
// Sirve para ver cómo es (ej. el gabinete) antes de elegirlo.
export default function VistaProducto({ producto, onCerrar }: { producto: ProductoArmador; onCerrar: () => void }) {
  const { t } = useTranslation();
  const textos = useTextosArmador();
  const plataforma = plataformaDe(producto);

  return (
    <Modal titulo={producto.nombre} onCerrar={onCerrar} ancho="lg">
      <div className="overflow-y-auto p-5">
        <div className="flex h-72 items-center justify-center rounded-xl border border-line bg-white p-4">
          {producto.imagenUrl ? (
            <img src={producto.imagenUrl} alt={producto.nombre} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-sm text-muted">{t("card.sinImagen")}</span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{producto.marca}</span>
            {plataforma && <BadgePlataforma plataforma={plataforma} />}
          </div>
          <Precio precio={producto.precio} className="text-xl font-bold text-primary" />
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink">{producto.descripcion || t("armarPc.sinDescripcion")}</p>

        {producto.especificaciones.length > 0 && (
          <>
            <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">
              {t("armarPc.especificacionesTitulo")}
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {producto.especificaciones.map((e) => (
                <li key={e.nombre} className="rounded bg-surface-alt px-2 py-1 text-xs text-ink">
                  {textos.especificacion(e)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  );
}

// Logos de Wikimedia Commons, como las fotos de los productos
const LOGOS = {
  AMD: "https://upload.wikimedia.org/wikipedia/commons/7/7c/AMD_Logo.svg",
  Intel: "https://upload.wikimedia.org/wikipedia/commons/8/85/Intel_logo_2023.svg",
};

// "Para AMD" / "Para Intel" con el logo, en los motherboards
export function BadgePlataforma({ plataforma }: { plataforma: "AMD" | "Intel" }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-ink ring-1 ring-line ring-inset">
      <img src={LOGOS[plataforma]} alt="" className={plataforma === "AMD" ? "h-2.5 w-auto" : "h-3 w-auto"} />
      {t("armarPc.plataforma", { marca: plataforma })}
    </span>
  );
}
