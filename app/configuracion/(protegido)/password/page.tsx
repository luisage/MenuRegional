import PasswordForm from "./PasswordForm";

export const metadata = { title: "Editar contraseña | Configuración" };

export default function PasswordAdminPage() {
  return (
    <div>
      <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-amber">
        Configuración
      </p>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl font-bold text-cream">
        Editar contraseña
      </h1>
      <p className="mt-2 mb-8 text-sand">
        Actualiza la contraseña de tu cuenta de administrador.
      </p>

      <PasswordForm />
    </div>
  );
}
