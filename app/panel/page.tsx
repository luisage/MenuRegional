import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesionRestauranteId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { PlateIcon, MenuListIcon, OrdersIcon, ClockIcon, StoreIcon } from "./icons";

const accesos = [
  {
    href: "/panel/datos",
    label: "Datos del restaurante",
    desc: "Actualiza la información de tu restaurante.",
    icon: <StoreIcon />,
  },
  {
    href: "/panel/platillos/nuevo",
    label: "Administrar menú",
    desc: "Agrega un nuevo platillo a tu menú.",
    icon: <PlateIcon />,
  },
  {
    href: "/panel/horario",
    label: "Registrar horario",
    desc: "Define los horarios de atención de tus sucursales.",
    icon: <ClockIcon />,
  },
  {
    href: "/panel/menu",
    label: "Ver menú",
    desc: "Revisa y organiza tus categorías y platillos.",
    icon: <MenuListIcon />,
  },
  {
    href: "/panel/pedidos",
    label: "Ver pedidos",
    desc: "Consulta los pedidos recibidos por WhatsApp.",
    icon: <OrdersIcon />,
  },
];

export default async function PanelPage() {
  const cuentaId = await obtenerSesionRestauranteId();
  if (!cuentaId) redirect("/");

  const cuenta = await prisma.cuentaRestaurante.findUnique({
    where: { id: cuentaId },
    select: {
      nombreDueno: true,
      restaurante: { select: { nombre: true } },
    },
  });

  if (!cuenta?.restaurante) redirect("/");

  return (
    <div>
      <p className="text-amber font-sans text-xs font-bold uppercase tracking-[0.14em]">
        Panel de control
      </p>
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-cream mt-2">
        Hola, {cuenta.nombreDueno}
      </h1>
      <p className="text-sand mt-2 max-w-prose">
        Desde aquí puedes gestionar todo lo relacionado con{" "}
        <span className="text-cream font-semibold">{cuenta.restaurante.nombre}</span>.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {accesos.map((acceso) => (
          <Link
            key={acceso.href}
            href={acceso.href}
            className="group flex flex-col gap-3 rounded-2xl border border-cream/10 bg-wood/40 p-5 transition-colors hover:border-gold/40 hover:bg-wood/60"
          >
            <span className="grid size-11 place-items-center rounded-full bg-gold/10 border border-gold/25 text-gold">
              {acceso.icon}
            </span>
            <div>
              <p className="font-sans font-bold text-cream">{acceso.label}</p>
              <p className="text-sand text-sm mt-1">{acceso.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
