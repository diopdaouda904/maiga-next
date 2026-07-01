"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/stock", label: "Stock" },
  { href: "/scanner", label: "Scanner" },
  { href: "/historique", label: "Historique" },
];
const PATRON_TABS = [
  { href: "/produits", label: "Produits" },
  { href: "/admin", label: "Admin" },
];

export default function AppNav({ role }) {
  const pathname = usePathname();
  const router = useRouter();
  const tabs = role === "patron" ? [...TABS, ...PATRON_TABS] : TABS;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-20 bg-bg">
      <div className="flex items-center justify-between border-b border-bdr py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px] bg-acc font-mono text-[0.68rem] font-bold text-ink">
            M
          </div>
          <span className="text-[0.92rem] font-bold tracking-tight text-txt">
            Maïga Smash
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-bdr bg-surf px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-sub">
            {role === "patron" ? "Patron" : "Employé"}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-bdr bg-surf px-2.5 py-1 text-[0.72rem] font-medium text-sub transition hover:border-dngr hover:text-dngr"
          >
            Quitter
          </button>
        </div>
      </div>

      <nav className="flex gap-0 border-b border-bdr">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-[0.82rem] font-medium border-b-2 -mb-px transition ${
                active
                  ? "border-acc text-txt"
                  : "border-transparent text-sub hover:text-txt"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
