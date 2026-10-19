import { urlNotificaciones } from "./api";

// La interfaz que coincide con lo que devuelve nuestro backend
export interface Notificacion {
  id: number;
  mensaje: string;
  leida: boolean;
  fecha: string;
  idVenta: number | null;
  tipo: string;
}

export async function obtenerNotificacionesUsuario(
  idUsuario: number | string,
): Promise<Notificacion[]> {
  const res = await fetch(`${urlNotificaciones}/${idUsuario}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al cargar notificaciones");
  return res.json();
}

export async function marcarNotificacionLeida(
  idNotificacion: number,
): Promise<void> {
  const res = await fetch(`${urlNotificaciones}/${idNotificacion}/leida`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Error al actualizar la notificación");
}
