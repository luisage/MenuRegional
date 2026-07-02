const ZONA_MX = "America/Mexico_City";

/** Fecha de hoy en Ciudad de México, formato YYYY-MM-DD */
export function fechaHoyMexico(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_MX }).format(new Date());
}

/**
 * Convierte una fecha local YYYY-MM-DD (en hora de Ciudad de México)
 * a los límites UTC reales de ese día.
 * Funciona correctamente tanto en CDT (UTC-5, verano) como en CST (UTC-6, invierno).
 */
export function rangoFechaMexico(fechaLocal: string): { inicio: Date; fin: Date } {
  // A las 12:00 UTC del día dado, determinamos qué hora es en México
  // CDT (UTC-5): 12 UTC → 07:00 MX  → offset 5 h
  // CST (UTC-6): 12 UTC → 06:00 MX  → offset 6 h
  const refUtc = new Date(`${fechaLocal}T12:00:00.000Z`);
  const horaMx = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONA_MX,
      hour: "numeric",
      hour12: false,
    }).format(refUtc),
    10
  );
  const offsetHoras = 12 - horaMx; // CDT→5, CST→6
  const offsetStr = `-${String(offsetHoras).padStart(2, "0")}:00`;

  return {
    inicio: new Date(`${fechaLocal}T00:00:00${offsetStr}`),
    fin: new Date(`${fechaLocal}T23:59:59.999${offsetStr}`),
  };
}
