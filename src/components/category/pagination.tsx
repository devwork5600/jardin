import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

const ITEM =
  "flex h-10 min-w-10 items-center justify-center rounded-[10px] border text-[13px] font-semibold";

export function Pagination({ page, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={`${ITEM} ${
            n === page
              ? "border-ink bg-ink text-ivory"
              : "border-border text-ink"
          }`}
        >
          {n}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          aria-label="Page suivante"
          className={`${ITEM} border-border text-ink`}
        >
          →
        </Link>
      )}
    </nav>
  );
}
