"use client";

import { useState } from "react";

type Props = {
  description: string[];
  specs: { label: string; value: string }[];
  conseil: string | null;
};

export function ProductTabs({ description, specs, conseil }: Props) {
  const tabs = [
    { id: "description", label: "Description", show: description.length > 0 },
    { id: "specs", label: "Caractéristiques", show: specs.length > 0 },
    { id: "conseil", label: "Conseil", show: !!conseil },
  ].filter((tab) => tab.show);

  const [active, setActive] = useState(tabs[0]?.id);

  if (tabs.length === 0) return null;

  return (
    <section className="container-page pb-[clamp(56px,7vw,96px)]">
      <div
        role="tablist"
        className="flex flex-wrap gap-x-8 gap-y-1.5 border-b border-border"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            onClick={() => setActive(tab.id)}
            className={`-mb-px cursor-pointer border-b-2 py-3.5 font-serif text-lg ${
              tab.id === active
                ? "border-ink text-ink"
                : "border-transparent text-text-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-8">
        {active === "description" && (
          <div className="flex max-w-[62ch] flex-col gap-4 text-[15px] leading-[1.75] text-text-secondary">
            {description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {active === "specs" && (
          <ul className="max-w-[640px]">
            {specs.map((spec) => (
              <li
                key={spec.label}
                className="flex justify-between gap-4 border-b border-border py-3.5 text-[14.5px]"
              >
                <span className="text-text-tertiary">{spec.label}</span>
                <span className="text-right font-semibold text-ink">
                  {spec.value}
                </span>
              </li>
            ))}
          </ul>
        )}

        {active === "conseil" && conseil && (
          <div className="max-w-[640px] rounded-[20px] bg-green-deep p-7 text-ivory">
            <span className="text-[10.5px] font-bold tracking-[0.2em] text-lime uppercase">
              Le conseil de la boutique
            </span>
            <p className="mt-3.5 font-serif text-xl leading-normal italic">
              « {conseil} »
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
