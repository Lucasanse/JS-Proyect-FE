// Achica una foto antes de mandarla a analizar: las del celular pesan varios MB y para
// que la IA lea una etiqueta alcanza con 1600 px. Así se sube más rápido y no se pasa
// el límite del BE. Si el navegador no la puede leer (ej. HEIC en Chrome), va como está.

const LADO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.85;

export async function reducirFoto(archivo: File): Promise<File> {
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagen.width * escala);
    canvas.height = Math.round(imagen.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;
    ctx.fillStyle = "#fff"; // fondo blanco para los PNG con transparencia
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    imagen.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], `${archivo.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}
