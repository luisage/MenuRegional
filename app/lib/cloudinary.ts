import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

type UploadResult = { url: string; publicId: string };

export async function subirImagen(
  imagen: File,
  carpeta: string
): Promise<UploadResult> {
  if (!imagen.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (imagen.size > MAX_IMAGE_SIZE) {
    throw new Error("La imagen no debe superar 5 MB.");
  }

  const buffer = Buffer.from(await imagen.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: carpeta, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Error al subir la imagen a Cloudinary."));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );
    stream.end(buffer);
  });
}

export async function eliminarImagen(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
