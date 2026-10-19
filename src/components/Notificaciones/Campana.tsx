import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  type Notificacion,
  obtenerNotificacionesUsuario,
  marcarNotificacionLeida,
} from "../../services/notificaciones";
import { formatearFechaNotificacion } from "./formateadorFechas";
import { useTranslation } from "react-i18next";

interface Props {
  idUsuario: string | undefined;
}

export const CampanaNotificaciones = ({ idUsuario }: Props) => {
  const { t, i18n } = useTranslation();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cargar las notificaciones al montar el componente
  useEffect(() => {
    if (!idUsuario) return;

    obtenerNotificacionesUsuario(idUsuario)
      .then(setNotificaciones)
      .catch(console.error);
  }, [idUsuario]);

  // Cerrar el menú si el usuario hace clic afuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickAfuera);
    return () => document.removeEventListener("mousedown", handleClickAfuera);
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const handleMarcarLeida = async (idNotificacion: number) => {
    // 1. Actualización optimista en el frontend
    setNotificaciones((prev) =>
      prev.map((notif) =>
        notif.id === idNotificacion ? { ...notif, leida: true } : notif,
      ),
    );

    // 2. Avisarle al backend
    try {
      await marcarNotificacionLeida(idNotificacion);
    } catch (error) {
      console.error("Falló al marcar como leída", error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón de la Campana */}
      <button
        onClick={() => setAbierto(!abierto)}
        type="button"
        className="relative p-2 text-ink hover:text-accent transition-colors rounded-full hover:bg-surface-alt"
        aria-label={t("nav.notificaciones")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* Badge de contador */}
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-primary rounded-full px-1">
            {noLeidas}
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {abierto && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-line rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-line bg-surface-alt">
            <h3 className="font-bold text-ink text-sm">Notificaciones</h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <p className="p-4 text-center text-muted text-sm">
                No tenés notificaciones
              </p>
            ) : (
              <ul className="flex flex-col">
                {notificaciones.map((notif) => (
                  <li
                    key={notif.id}
                    className={`flex flex-col p-3 border-b border-line hover:bg-surface-alt transition-colors ${!notif.leida ? "bg-accent/5" : ""}`}
                  >
                    <p
                      className={`text-sm ${!notif.leida ? "font-semibold text-ink" : "text-muted"}`}
                    >
                      {notif.mensaje}
                    </p>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[11px] text-muted">
                        {formatearFechaNotificacion(notif.fecha)}
                      </span>

                      <div className="flex gap-3">
                        {notif.idVenta && (
                          <Link
                            to={`/miscompras/${idUsuario}`}
                            className="text-[11px] text-accent hover:underline font-medium"
                            onClick={() => setAbierto(false)}
                          >
                            Ver detalle
                          </Link>
                        )}
                        {!notif.leida && (
                          <button
                            onClick={() => handleMarcarLeida(notif.id)}
                            className="text-[11px] text-primary hover:underline font-medium"
                          >
                            Marcar leída
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
