import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/app/lib/cloudinary";

const CARPETAS_PERMITIDAS = [
  "menu_regional/restaurantes",
  "menu_regional/portadas",
  "menu_regional/platillos",
  "menu_regional/avisos",
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const carpeta = typeof body.carpeta === "string" ? body.carpeta : "";

  if (!CARPETAS_PERMITIDAS.includes(carpeta)) {
    return NextResponse.json({ error: "Carpeta no permitida." }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { folder: carpeta, timestamp };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
  });
}
