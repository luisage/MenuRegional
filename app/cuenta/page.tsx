import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerSesionClienteId } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";
import { cerrarSesionCliente } from "@/app/lib/actions/sesion";

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function CuentaPage() {
  const clienteId = await obtenerSesionClienteId();
  if (!clienteId) redirect("/");

  const cuenta = await prisma.cuentaCliente.findUnique({
    where: { id: clienteId },
    select: { nombre: true },
  });

  if (!cuenta) redirect("/");

  const primerNombre = cuenta.nombre.trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-espresso text-cream">
      <header className="flex items-center justify-between border-b border-cream/10 px-5 md:px-10 py-4">
        <Link href="/" className="font-serif text-lg font-bold text-cream no-underline">
          Menú <span className="text-gold">Regional</span>
        </Link>
        <form action={cerrarSesionCliente}>
          <button
            type="submit"
            className="cursor-pointer rounded-full border border-cream/15 bg-[#c0392b]/15 px-4 py-2 text-sm font-bold text-[#ff9b8a] transition-colors hover:bg-[#c0392b]/25"
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-3xl px-5 md:px-10 py-16 md:py-24 text-center">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-amber">
          Mi cuenta
        </p>
        <h1 className="mt-2 font-serif text-3xl md:text-5xl font-bold text-cream">
          Hola {primerNombre}, ¿qué se te antoja hoy?
        </h1>
        <p className="mt-3 text-sand">Busca restaurantes o platillos de tu región.</p>

        <div className="relative mx-auto mt-8 max-w-xl">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Busca restaurantes o platillos..."
            className="w-full rounded-full border border-cream/15 bg-wood/40 py-4 pl-12 pr-5 text-base text-cream outline-none transition-colors placeholder:text-sand/70 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/30"
          />
        </div>
      </main>
    </div>
  );
}
