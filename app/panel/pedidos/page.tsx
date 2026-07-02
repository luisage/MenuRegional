import { obtenerPedidos } from "@/app/lib/actions/pedidos";
import { fechaHoyMexico } from "@/app/lib/fechas";
import PedidosClient from "./PedidosClient";

export default async function VerPedidosPage() {
  const hoy = fechaHoyMexico();
  const result = await obtenerPedidos(hoy);
  const pedidos = "ok" in result ? result.pedidos : [];

  return <PedidosClient pedidosIniciales={pedidos} fechaInicial={hoy} />;
}
