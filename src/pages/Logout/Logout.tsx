// src/pages/Logout/Logout.tsx
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSession, signOut } from "../../services/auth-client";

export default function Logout() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [cerrando, setCerrando] = useState(false);

  if (isPending) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
        <p className="text-muted">Verificando sesión...</p>
      </section>
    );
  }

  // Si no hay sesión activa y entra a /logout, lo mandamos a /login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    setCerrando(true);
    await signOut();
    setCerrando(false);
    navigate("/login"); // Al borrar la cookie, lo llevamos al login
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Mi Cuenta</h1>
        <p className="mt-2 text-muted">
          Has iniciado sesión como <strong>{session.user.name}</strong>
        </p>

        <div className="mt-6 space-y-2 rounded-lg border border-line bg-surface-alt p-4 text-left text-sm text-ink">
          <p>
            <span className="font-semibold">Email:</span> {session.user.email}
          </p>
          <p>
            <span className="font-semibold">Rol:</span> {session.user.rol}
          </p>
          <p>
            <span className="font-semibold">Dirección:</span>{" "}
            {session.user.direccion || "No especificada"}
          </p>
          <p>
            <span className="font-semibold">Teléfono:</span>{" "}
            {session.user.telefono || "No especificado"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={cerrando}
          className="mt-6 w-full rounded-lg bg-red-600 text-white py-2 font-semibold 
                     hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {cerrando ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>
    </section>
  );
}
