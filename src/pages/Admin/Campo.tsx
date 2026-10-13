import type { ReactNode } from "react";

interface Props {
  id: string; // id del input, para asociar el label
  label: string;
  error?: string;
  requerido?: boolean;
  ayuda?: string;
  children: ReactNode;
}

// Label + input + mensaje de error, con el formato de los formularios del admin.
// El input tiene que llevar id={id} y aria-describedby={`${id}-error`} cuando hay error.
export default function Campo({ id, label, error, requerido, ayuda, children }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {requerido && <span className="text-primary"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1 text-xs text-muted">{ayuda}</p>
      )}
    </div>
  );
}
