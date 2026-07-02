type PanelPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function PanelPlaceholder({ eyebrow, title, description }: PanelPlaceholderProps) {
  return (
    <div>
      <p className="text-amber font-sans text-xs font-bold uppercase tracking-[0.14em]">
        {eyebrow}
      </p>
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-cream mt-2">{title}</h1>

      <div className="mt-8 rounded-2xl border border-dashed border-cream/15 bg-wood/30 p-10 text-center">
        <p className="font-serif text-xl font-bold text-cream">Próximamente</p>
        <p className="text-sand mt-2 max-w-prose mx-auto">{description}</p>
      </div>
    </div>
  );
}
