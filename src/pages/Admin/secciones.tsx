import type { ReactNode } from "react";
import { IconoCaja, IconoHerramienta, IconoRecibo, IconoUsuarios } from "./IconosAdmin";

// Funcionalidades del panel de administración. Las usan el menú (AdminLayout)
// y la página de inicio "¿Qué querés hacer?" (AdminInicio).
// Para sumar una: agregar la ruta hija de "admin" en main.tsx y una entrada acá.
// Con disponible: false se muestra como "Pronto", sin link.
export interface SeccionAdmin {
  to: string;
  tituloKey: string;
  descripcionKey: string;
  icono: ReactNode;
  disponible: boolean;
}

export const SECCIONES_ADMIN: SeccionAdmin[] = [
  {
    to: "productos",
    tituloKey: "admin.menu.productos",
    descripcionKey: "admin.inicio.productos",
    icono: <IconoCaja />,
    disponible: true,
  },
  {
    to: "servicio-tecnico",
    tituloKey: "admin.menu.servicioTecnico",
    descripcionKey: "admin.inicio.servicioTecnico",
    icono: <IconoHerramienta />,
    disponible: false,
  },
  {
    to: "ventas",
    tituloKey: "admin.menu.ventas",
    descripcionKey: "admin.inicio.ventas",
    icono: <IconoRecibo />,
    disponible: false,
  },
  {
    to: "usuarios",
    tituloKey: "admin.menu.usuarios",
    descripcionKey: "admin.inicio.usuarios",
    icono: <IconoUsuarios />,
    disponible: false,
  },
];
