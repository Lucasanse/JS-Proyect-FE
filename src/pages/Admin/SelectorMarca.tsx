import { useState } from "react";
import { useTranslation } from "react-i18next";
import { crearMarca, type MarcaAdmin } from "../../services/adminProductos";
import { claseInput } from "./estilosForm";

interface Props {
  id: string;
  marcas: MarcaAdmin[];
  idCategoria: string; // "" si todavía no se eligió
  value: string; // id de la marca elegida o ""
  error?: string;
  cargando: boolean;
  onChange: (idMarca: string) => void;
  onMarcaCreada: (marca: MarcaAdmin) => void;
}

const NUEVA = "__nueva";

// Select de marcas: primero las que ya tienen productos en la categoría elegida,
// después el resto, y al final "+ Agregar marca nueva", que se crea ahí mismo.
export default function SelectorMarca({
  id,
  marcas,
  idCategoria,
  value,
  error,
  cargando,
  onChange,
  onMarcaCreada,
}: Props) {
  const { t } = useTranslation();
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorNueva, setErrorNueva] = useState("");

  const delaCategoria = marcas.filter((m) => m.categorias.includes(Number(idCategoria)));
  const otras = marcas.filter((m) => !delaCategoria.includes(m));

  const cancelar = () => {
    setCreando(false);
    setNombre("");
    setErrorNueva("");
  };

  const agregar = async () => {
    if (!nombre.trim()) {
      setErrorNueva(t("admin.form.obligatorio"));
      return;
    }
    setGuardando(true);
    setErrorNueva("");
    try {
      const marca = await crearMarca(nombre.trim());
      onMarcaCreada(marca);
      onChange(String(marca.id));
      cancelar();
    } catch (e) {
      setErrorNueva(e instanceof Error ? e.message : t("admin.errorGenerico"));
    } finally {
      setGuardando(false);
    }
  };

  if (creando) {
    return (
      <div>
        <div className="flex gap-2">
          <input
            id={id}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              // Enter agrega la marca (no envía el formulario) y Escape cancela (no cierra el modal)
              if (e.key === "Enter") {
                e.preventDefault();
                agregar();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                cancelar();
              }
            }}
            placeholder={t("admin.form.nombreMarca")}
            maxLength={100}
            autoFocus
            disabled={guardando}
            aria-invalid={!!errorNueva}
            aria-describedby={errorNueva ? `${id}-error-nueva` : undefined}
            className={claseInput(errorNueva)}
          />
          <button
            type="button"
            onClick={agregar}
            disabled={guardando}
            className="shrink-0 cursor-pointer rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {guardando ? "..." : t("admin.form.agregar")}
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={guardando}
            aria-label={t("admin.cancelar")}
            className="shrink-0 cursor-pointer rounded-lg border border-line px-2.5 text-muted hover:bg-surface-alt hover:text-ink"
          >
            ✕
          </button>
        </div>
        {errorNueva && (
          <p id={`${id}-error-nueva`} className="mt-1 text-xs text-red-600">
            {errorNueva}
          </p>
        )}
      </div>
    );
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => (e.target.value === NUEVA ? setCreando(true) : onChange(e.target.value))}
      disabled={!idCategoria || cargando}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={claseInput(error)}
    >
      <option value="">
        {cargando ? t("nav.cargando") : idCategoria ? t("admin.form.elegi") : t("admin.form.elegiPrimeroCategoria")}
      </option>
      {delaCategoria.length > 0 && (
        <optgroup label={t("admin.form.marcasDeCategoria")}>
          {delaCategoria.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </optgroup>
      )}
      {otras.length > 0 && (
        <optgroup label={delaCategoria.length > 0 ? t("admin.form.otrasMarcas") : t("admin.form.todasLasMarcas")}>
          {otras.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </optgroup>
      )}
      <option value={NUEVA}>+ {t("admin.form.nuevaMarca")}</option>
    </select>
  );
}
