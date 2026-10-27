import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  cambiarHabilitadoUsuario,
  type UsuarioAdmin,
  type UsuarioAdminDetalle,
} from "../../services/adminUsuarios";
import Modal from "../../components/Modal/Modal";

// Piezas que comparten el listado (AdminUsuarios) y el detalle (AdminUsuarioDetalle) de usuarios.

export function RolBadge({ rol }: { rol: UsuarioAdmin["rol"] }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${
        rol === "ADMIN" ? "bg-primary-light text-primary ring-primary/25" : "bg-surface-alt text-muted ring-line"
      }`}
    >
      {t(`admin.us.rol.${rol}`, { defaultValue: rol })}
    </span>
  );
}

// Solo se deshabilitan clientes: con la cuenta propia y con otros admins el switch queda
// bloqueado con la explicación (el BE igual responde 409).
export function SwitchHabilitado({
  usuario,
  propio,
  onCambiar,
}: {
  usuario: UsuarioAdmin;
  propio: boolean;
  onCambiar: () => void;
}) {
  const { t } = useTranslation();
  const activo = usuario.habilitado;
  const bloqueado = activo && (propio || usuario.rol === "ADMIN");
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={t("admin.us.switchAria", { nombre: usuario.nombre })}
      disabled={bloqueado}
      onClick={onCambiar}
      title={
        bloqueado
          ? t(propio ? "admin.us.noPropia" : "admin.us.noOtroAdmin")
          : activo
            ? t("admin.us.ayudaDeshabilitar")
            : t("admin.us.ayudaHabilitar")
      }
      className="group flex cursor-pointer items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
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
        {activo ? t("admin.us.habilitado") : t("admin.us.deshabilitado")}
      </span>
    </button>
  );
}

export function ConfirmarCambio({
  usuario,
  onCerrar,
  onCambiado,
}: {
  usuario: UsuarioAdmin;
  onCerrar: () => void;
  onCambiado: (u: UsuarioAdminDetalle) => void;
}) {
  const { t } = useTranslation();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const deshabilitar = usuario.habilitado;

  const confirmar = async () => {
    setGuardando(true);
    setError("");
    try {
      onCambiado(await cambiarHabilitadoUsuario(usuario.id, !deshabilitar));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.errorGenerico"));
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo={deshabilitar ? t("admin.us.deshabilitarTitulo") : t("admin.us.habilitarTitulo")}
      onCerrar={onCerrar}
      bloqueado={guardando}
    >
      <div className="space-y-3 px-5 py-4 text-sm">
        <p className="text-ink">
          {t(deshabilitar ? "admin.us.deshabilitarPregunta" : "admin.us.habilitarPregunta", {
            nombre: usuario.nombre,
          })}
        </p>
        <p className="break-all text-muted">{usuario.correo}</p>
        <p className="text-muted">{deshabilitar ? t("admin.us.deshabilitarAviso") : t("admin.us.habilitarAviso")}</p>
        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </p>
        )}
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
          type="button"
          onClick={confirmar}
          disabled={guardando}
          data-autofocus
          className={`cursor-pointer rounded-lg px-4 py-2 font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-60 ${
            deshabilitar ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {guardando
            ? t("admin.us.guardando")
            : deshabilitar
              ? t("admin.us.deshabilitar")
              : t("admin.us.habilitar")}
        </button>
      </footer>
    </Modal>
  );
}
