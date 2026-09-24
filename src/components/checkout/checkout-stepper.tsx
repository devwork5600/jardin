const STEPS = ["Panier", "Retrait & paiement", "Confirmation"];

// current: 1-based index of the active step. Earlier steps are done (✓).
export function CheckoutStepper({ current }: { current: 2 | 3 }) {
  return (
    <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-[12.5px] font-semibold">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;

        return (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && <span className="text-border-strong">—</span>}
            <span
              aria-current={active ? "step" : undefined}
              className={
                active
                  ? "rounded-pill bg-status-open-bg px-3 py-1.5 text-ink"
                  : done
                    ? "text-brand-green"
                    : "text-text-faint"
              }
            >
              {step}. {label}
              {done && " ✓"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
