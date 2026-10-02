export default function Login() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-alt px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-lg p-8">
        <h1 className="text-3xl font-bold text-primary text-center">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-muted text-center">
          Bienvenido, ingresa tus credenciales
        </p>

        <form className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="tuemail@ejemplo.com"
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="********"
              className="w-full rounded-lg border border-line px-4 py-2 
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary text-surface py-2 font-semibold 
                       hover:bg-primary-dark transition-colors"
          >
            Entrar
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-secondary-dark hover:underline">
            Regístrate aquí
          </a>
        </p>
      </div>
    </section>
  );
}
