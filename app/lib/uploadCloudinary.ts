const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export type UploadResult = { url: string; publicId: string };

export async function subirImagenDirecto(
  file: File,
  carpeta: string
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("La imagen no debe superar 5 MB.");
  }

  // 1. Obtener firma del servidor (no expone el API secret al cliente)
  const sigRes = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ carpeta }),
  });
  if (!sigRes.ok) {
    throw new Error("No se pudo obtener la firma de subida.");
  }
  const { signature, timestamp, cloudName, apiKey } = await sigRes.json() as {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
  };

  // 2. Subir directamente a Cloudinary (sin pasar por Vercel)
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", carpeta);
  fd.append("timestamp", String(timestamp));
  fd.append("signature", signature);
  fd.append("api_key", apiKey);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd }
  );

  const data = await uploadRes.json() as { secure_url?: string; public_id?: string; error?: { message: string } };

  if (!uploadRes.ok || data.error) {
    throw new Error(data.error?.message ?? "Error al subir la imagen a Cloudinary.");
  }

  return { url: data.secure_url!, publicId: data.public_id! };
}
