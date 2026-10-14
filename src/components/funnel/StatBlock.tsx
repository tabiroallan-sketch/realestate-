type StatBlockProps = {
  figure: string;
  label: string;
  className?: string;
};

export function StatBlock({ figure, label, className }: StatBlockProps) {
  return (
    <div className={className}>
      <p className="display-s">{figure}</p>
      <p className="mt-3 font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-ivory-faint">
        {label}
      </p>
    </div>
  );
}
