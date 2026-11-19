"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/reglages", label: "Aperçu" },
  { href: "/reglages/profil", label: "Profil" },
  { href: "/reglages/course", label: "Course" },
  { href: "/reglages/muscu", label: "Musculation" },
  { href: "/reglages/poids", label: "Poids" },
  { href: "/reglages/sante", label: "Santé" },
  { href: "/reglages/objectifs", label: "Objectifs" },
  { href: "/reglages/donnees", label: "Données" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections des réglages"
      className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-[#e8e9e1] bg-white p-2"
    >
      {TABS.map((tab) => {
        const active = tab.href === "/reglages" ? pathname === "/reglages" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[#eaf2df] text-[#245642]"
                : "text-[#6f776e] hover:bg-[#f4f6f1] hover:text-[#23372f]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
