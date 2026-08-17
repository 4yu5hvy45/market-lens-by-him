interface FilterRailProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function FilterRail({ options, value, onChange }: FilterRailProps) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ${
              active
                ? "border-primary/30 bg-primary/8 text-primary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
