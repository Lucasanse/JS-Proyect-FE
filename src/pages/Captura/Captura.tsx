import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n";
import { enviarFotosCaptura, infoCaptura, type EstadoCaptura } from "../../services/analisisIA";

// Página que abre el celular al escanear el QR del formulario de productos.
// No necesita sesión: el token de la URL hace de permiso y vence a los pocos minutos.
// Va fuera de MainLayout para que cargue liviana en el celular (sin navbar ni carrito).
//
// Cada foto se envía apenas se saca: al abrir la cámara el navegador queda en segundo
// plano y puede recargar la página al volver, y así no se pierde ninguna foto.
export default function Captura() {
  const { t } = useTranslation();
  const { token = "" } = useParams();
  const inputCamara = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<EstadoCaptura | null>(null);
  const [vencido, setVencido] = useState(false);
  const [enviando, setEnviando] = useState(0); // cantidad de fotos que se están enviando
  const [enviadas, setEnviadas] = useState<string[]>([]); // miniaturas de lo enviado en esta visita
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    infoCaptura(token, controller.signal)
      .then(setEstado)
      .catch(() => {
        if (!controller.signal.aborted) setVencido(true);
      });
    return () => controller.abort();
  }, [token]);

  const quedan = estado ? estado.maxFotos - estado.fotos : 0;

  const enviar = async (lista: FileList | null) => {
    let archivos = [...(lista ?? [])].filter((a) => a.type.startsWith("image/"));
    if (inputCamara.current) inputCamara.current.value = "";
    if (inputGaleria.current) inputGaleria.current.value = "";
    setError("");
    if (archivos.length > quedan) {
      setError(t("captura.maxFotos", { max: estado?.maxFotos }));
      archivos = archivos.slice(0, Math.max(quedan, 0));
    }
    if (archivos.length === 0) return;

    setEnviando(archivos.length);
    try {
      setEstado(await enviarFotosCaptura(token, archivos));
      setEnviadas((prev) => [...prev, ...archivos.map((a) => URL.createObjectURL(a))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("captura.error"));
    } finally {
      setEnviando(0);
    }
  };

  const boton =
    "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-4 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-svh bg-surface-alt px-4 py-6 text-ink">
      <div className="mx-auto max-w-md space-y-5">
        <header className="space-y-1 text-center">
          <h1 className="m-0 text-xl font-bold">{t("captura.titulo")}</h1>
          <p className="m-0 text-sm text-muted">{t("captura.ayuda")}</p>
        </header>

        {vencido ? (
          <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-center text-red-700">
            {t("captura.vencido")}
          </p>
        ) : !estado ? (
          <p className="text-center text-muted">{t("nav.cargando")}</p>
        ) : (
          <>
            <p className="m-0 text-center font-semibold" aria-live="polite">
              {t("captura.enviadas", { cantidad: estado.fotos, max: estado.maxFotos })}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => inputCamara.current?.click()}
                disabled={quedan <= 0 || enviando > 0}
                className={`${boton} bg-primary text-white hover:bg-primary-dark`}
              >
                {t("captura.sacarFoto")}
              </button>
              <button
                type="button"
                onClick={() => inputGaleria.current?.click()}
                disabled={quedan <= 0 || enviando > 0}
                className={`${boton} border border-line bg-surface text-ink hover:border-primary`}
              >
                {t("captura.galeria")}
              </button>
              <input
                ref={inputCamara}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => enviar(e.target.files)}
              />
              <input
                ref={inputGaleria}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => enviar(e.target.files)}
              />
            </div>

            <div aria-live="polite" className="space-y-3 text-center">
              {enviando > 0 && (
                <p className="m-0 rounded-xl bg-surface p-3 font-semibold text-primary">
                  {t("captura.enviando", { count: enviando })}
                </p>
              )}
              {enviando === 0 && enviadas.length > 0 && (
                <p className="m-0 rounded-xl bg-green-50 p-3 text-green-800">✓ {t("captura.listo")}</p>
              )}
              {error && (
                <p role="alert" className="m-0 text-red-700">
                  {error}
                </p>
              )}
            </div>

            {enviadas.length > 0 && (
              <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
                {enviadas.map((vista) => (
                  <li key={vista} className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface">
                    <img src={vista} alt="" className="h-full w-full object-cover" />
                    <span className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-700 text-xs text-white">
                      ✓
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
