const ZONA_CDMX = "America/Mexico_City";

const MAPA_DIA_CORTO: Record<string, string> = {
  Sun: "DOMINGO",
  Mon: "LUNES",
  Tue: "MARTES",
  Wed: "MIERCOLES",
  Thu: "JUEVES",
  Fri: "VIERNES",
  Sat: "SABADO",
};

export type HorarioDiaVista = {
  dia: string;
  apertura: string;
  cierre: string;
  abierto: boolean;
};

function diaYHoraActualCDMX(ahora: Date) {
  const diaCorto = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_CDMX,
    weekday: "short",
  }).format(ahora);

  const partesHora = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_CDMX,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ahora);

  const hora = partesHora.find((p) => p.type === "hour")?.value ?? "00";
  const minuto = partesHora.find((p) => p.type === "minute")?.value ?? "00";

  return { dia: MAPA_DIA_CORTO[diaCorto], hora: `${hora}:${minuto}` };
}

// Determina si una sucursal está abierta en este momento, según la hora de la Ciudad de México.
export function calcularSucursalAbierta(horarios: HorarioDiaVista[], ahora: Date = new Date()): boolean {
  const { dia, hora } = diaYHoraActualCDMX(ahora);
  const horarioHoy = horarios.find((h) => h.dia === dia);
  if (!horarioHoy || !horarioHoy.abierto) return false;
  return hora >= horarioHoy.apertura && hora < horarioHoy.cierre;
}
