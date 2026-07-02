export type PlanLimites = {
  precio: number;
  limiteSucursales: number | null;
  limitePlatillos: number | null;
} | null;

// Sin plan asignado se trata igual que el plan Gratis (el más restrictivo).
export function esPlanGratis(plan: PlanLimites): boolean {
  return (plan?.precio ?? 0) === 0;
}

export function puedeAgregarAvisos(plan: PlanLimites): boolean {
  return !esPlanGratis(plan);
}

export function puedeAgregarSucursal(plan: PlanLimites, sucursalesActuales: number): boolean {
  const limite = plan?.limiteSucursales ?? 1;
  if (limite == null || limite < 0) return true;
  return sucursalesActuales < limite;
}

export function puedeAgregarPlatillo(plan: PlanLimites, platillosActuales: number): boolean {
  const limite = plan?.limitePlatillos ?? 10;
  if (limite == null || limite < 0) return true;
  return platillosActuales < limite;
}
