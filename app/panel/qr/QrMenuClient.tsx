"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./QrMenu.module.css";

export type SucursalQr = { id: string; nombre: string; slug: string | null };

type Props = {
  restauranteNombre: string;
  restauranteSlug: string;
  logoUrl: string | null;
  sucursales: SucursalQr[];
};

// ── Canvas helpers ──────────────────────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Main component ──────────────────────────────────────────────────────────

export default function QrMenuClient({
  restauranteNombre,
  restauranteSlug,
  logoUrl,
  sucursales,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const multiSucursal = sucursales.length > 1;

  const [sucursalId, setSucursalId] = useState<string>(sucursales[0]?.id ?? "");
  const sucursal = sucursales.find((s) => s.id === sucursalId) ?? sucursales[0] ?? null;

  const buildUrl = useCallback(() => {
    const base = `https://menu-regional.com/explorar/${restauranteSlug}`;
    if (multiSucursal && sucursal) {
      const key = sucursal.slug ?? sucursal.id;
      return `${base}?sucursal=${key}&source=qr`;
    }
    return `${base}?source=qr`;
  }, [restauranteSlug, sucursal, multiSucursal]);

  const dibujar = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { toDataURL } = await import("qrcode");

    const W = 800;
    const QR_SIZE = 340;
    const LINE_H_NAME = 56;
    const cx = W / 2;
    const CONTENT_W = W - 120; // 60px padding each side

    // ── Measure text for height calculation ──
    const mc = document.createElement("canvas").getContext("2d")!;
    mc.font = `bold 48px Georgia, 'Times New Roman', serif`;
    const nameLines = getTextLines(mc, restauranteNombre, CONTENT_W);

    let contentH = 0;
    if (logoUrl) contentH += 90 + 28;
    contentH += nameLines.length * LINE_H_NAME + 16;
    if (multiSucursal && sucursal) contentH += 40;
    contentH += 36;
    contentH += QR_SIZE;
    contentH += 28;
    contentH += 36; // "Escanea y ordena"

    const TOP_PAD = 88;
    const BOT_PAD = 80;
    const H = TOP_PAD + contentH + BOT_PAD;

    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d")!;

    // ── Background ──
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    // ── Cream card ──
    ctx.fillStyle = "#FDF8F0";
    roundedRect(ctx, 20, 20, W - 40, H - 40, 24);
    ctx.fill();

    // ── Gold accent bar ──
    ctx.fillStyle = "#E8A930";
    roundedRect(ctx, 20, 20, W - 40, 10, 5);
    ctx.fill();

    // ── Load logo once ──
    let logoImg: HTMLImageElement | null = null;
    if (logoUrl) {
      try { logoImg = await loadImg(logoUrl); } catch { /* skip */ }
    }

    let y = TOP_PAD;

    // ── Logo at top ──
    if (logoImg) {
      const R = 45;
      // White bg circle
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, y + R, R + 4, 0, Math.PI * 2);
      ctx.fill();
      // Logo clipped to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, y + R, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, cx - R, y, R * 2, R * 2);
      ctx.restore();
      y += R * 2 + 28;
    }

    // ── Restaurant name ──
    ctx.fillStyle = "#1A0A00";
    ctx.font = `bold 48px Georgia, 'Times New Roman', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const line of nameLines) {
      ctx.fillText(line, cx, y);
      y += LINE_H_NAME;
    }
    y += 16;

    // ── Branch name (multi only) ──
    if (multiSucursal && sucursal) {
      ctx.fillStyle = "#7A4A24";
      ctx.font = `500 26px Arial, Helvetica, sans-serif`;
      ctx.fillText(sucursal.nombre, cx, y);
      y += 40;
    }

    y += 36; // gap before QR

    // ── QR code ──
    const qrUrl = buildUrl();
    const qrDataUrl = await toDataURL(qrUrl, {
      errorCorrectionLevel: "H",
      width: QR_SIZE,
      margin: 2,
      color: { dark: "#1A0A00", light: "#FFFFFF" },
    });
    const qrImg = await loadImg(qrDataUrl);

    // QR white bg card
    const qrX = cx - QR_SIZE / 2;
    ctx.fillStyle = "#FFFFFF";
    roundedRect(ctx, qrX - 6, y - 6, QR_SIZE + 12, QR_SIZE + 12, 12);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, y, QR_SIZE, QR_SIZE);

    // ── Logo overlay in center of QR ──
    if (logoImg) {
      const LR = 36;
      const lcy = y + QR_SIZE / 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(cx, lcy, LR + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, lcy, LR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, cx - LR, lcy - LR, LR * 2, LR * 2);
      ctx.restore();
    }

    y += QR_SIZE + 28;

    // ── "Escanea y ordena" ──
    ctx.fillStyle = "#7A4A24";
    ctx.font = `bold 24px Arial, Helvetica, sans-serif`;
    ctx.fillText("Escanea y ordena", cx, y);
  }, [restauranteNombre, logoUrl, sucursal, multiSucursal, buildUrl]);

  useEffect(() => {
    dibujar();
  }, [dibujar]);

  const descargar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-menu-${restauranteSlug}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback for CORS-tainted canvas (open in new tab → long-press save on mobile)
      window.open(canvas.toDataURL("image/png"), "_blank");
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>{restauranteNombre}</h1>
        <p className={styles.desc}>
          Comparte este código QR con tus clientes para que puedan ver tu menú y realizar
          su pedido directamente desde su celular.
        </p>
      </header>

      {multiSucursal && (
        <div className={styles.comboWrap}>
          <label htmlFor="sucursal-qr" className={styles.comboLabel}>
            Sucursal
          </label>
          <select
            id="sucursal-qr"
            className={styles.combo}
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
          >
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.canvasWrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <button type="button" className={styles.downloadBtn} onClick={descargar}>
        <DownloadIcon />
        Descargar QR
      </button>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
