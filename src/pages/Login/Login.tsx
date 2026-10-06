// src/pages/Login.tsx
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signIn, useSession } from "../../services/auth-client";

export default function Login() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  if (session) return <Navigate to="/logout" replace />;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCargando(true);

    const { error } = await signIn.email({ email, password });
    setCargando(false);

    if (error) {
      setErrorMsg(error.message || t("login.credencialesIncorrectas"));
      return;
    }

    navigate("/");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-lg p-8">
        <h1 className="text-3xl font-bold text-primary text-center">
          {t("login.titulo")}
        </h1>
        <p className="mt-2 text-muted text-center">
          {t("login.bienvenida")}
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-100 border border-red-300 px-4 py-2 text-sm text-red-700 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              {t("login.email")}
            </label>
            <input
              type="email"
              placeholder={t("login.placeholderEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              {t("login.contrasena")}
            </label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-primary text-surface py-2 font-semibold 
                       hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cargando ? t("login.entrando") : t("login.entrar")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {t("login.sinCuenta")}{" "}
          <Link to="/register" className="text-secondary-dark hover:underline">
            {t("login.registrate")}
          </Link>
        </p>
      </div>
    </section>
  );
}
