"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

const ITEMS = [
  { label: "Tableau de bord", href: "/compte", exact: true },
  { label: "Commandes", href: "/compte/commandes", exact: false },
  { label: "Favoris", href: "/compte/favoris", exact: false },
  { label: "Mes informations", href: "/compte/informations", exact: false },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const signOut = async () => {
    await authClient.signOut();
    // Whatever was cached belongs to the person who just left.
    queryClient.clear();
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      aria-label="Mon compte"
      className="flex min-w-[200px] flex-[0_1_230px] flex-col gap-1 min-[900px]:sticky min-[900px]:top-24"
    >
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[12px] px-4 py-[13px] font-serif text-base ${
              active ? "bg-ink text-ivory" : "text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={signOut}
        className="mt-3 cursor-pointer px-4 py-[13px] text-left text-[13px] font-semibold text-copper"
      >
        Se déconnecter
      </button>
    </nav>
  );
}
