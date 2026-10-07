import { createContext, useContext } from "react";

export type TipoToast = "exito" | "error" | "info";

export interface ToastContextValue {
  mostrarToast: (mensaje: string, tipo?: TipoToast) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
