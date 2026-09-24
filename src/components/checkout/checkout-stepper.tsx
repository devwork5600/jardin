import Link from "next/link";

const STEPS = [
  { label: "Panier", href: "/panier" },
  { label: "Retrait & paiement", href: undefined },
  { label: "Confirmation", href: undefined },
];

// current: 1-based index of the active step. Earlier steps are done (✓) and,
// when they have a page to go back to, link to it.
export function CheckoutStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-[12.5px] font-semibold">
      {STEPS.map(({ label, href }, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        const text = `${step}. ${label}${done ? " ✓" : ""}`;

        return (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && <span className="text-border-strong">—</span>}
            {done && href ? (
              <Link href={href} className="text-brand-green underline-offset-2 hover:underline">
                {text}
              </Link>
            ) : (
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
                {text}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
