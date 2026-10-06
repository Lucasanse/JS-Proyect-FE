// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signUp } from "../../services/auth-client";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCargando(true);

    const { error } = await signUp.email({
      name,
      email,
      password,
      direccion,
      telefono,
    });
    setCargando(false);

    if (error) {
      setErrorMsg(error.message || t("register.error"));
      return;
    }

    navigate("/");
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-alt px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-lg p-8">
        <h1 className="text-3xl font-bold text-primary text-center">
          {t("register.titulo")}
        </h1>
        <p className="mt-2 text-muted text-center">
          {t("register.subtitulo")}
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-100 border border-red-300 px-4 py-2 text-sm text-red-700 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              {t("register.nombre")}
            </label>
            <input
              type="text"
              placeholder={t("register.placeholderNombre")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              {t("register.email")}
            </label>
            <input
              type="email"
              placeholder={t("register.placeholderEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              {t("register.contrasena")}
            </label>
            <input
              type="password"
              placeholder={t("register.placeholderContrasena")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              {t("register.direccion")}
            </label>
            <input
              type="text"
              placeholder={t("register.placeholderDireccion")}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              {t("register.telefono")}
            </label>
            <input
              type="tel"
              placeholder={t("register.placeholderTelefono")}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
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
            {cargando ? t("register.registrando") : t("register.registrarme")}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {t("register.yaCuenta")}{" "}
          <Link to="/login" className="text-secondary-dark hover:underline">
            {t("register.iniciaSesion")}
          </Link>
        </p>
      </div>
    </section>
  );
}
