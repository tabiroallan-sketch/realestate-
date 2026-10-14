import { cn } from "@/lib/cn";

type UnitCardProps = {
  name: string;
  typology: string;
  interior: string;
  range: string;
  note: string;
  className?: string;
};

export function UnitCard({ name, typology, interior, range, note, className }: UnitCardProps) {
  return (
    <article className={cn("border border-hairline bg-ink-raised p-6 md:p-7", className)}>
      <h3 className="display-s">{name}</h3>
      <p className="caption mt-3">
        {typology} · {interior}
      </p>
      <p className="numeral mt-4 text-bronze">{range}</p>
      <p className="body-copy mt-4">{note}</p>
    </article>
  );
}
