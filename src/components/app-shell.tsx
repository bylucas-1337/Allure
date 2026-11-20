"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/ajouter", label: "Ajouter", icon: "add" },
  { href: "/historique", label: "Historique", icon: "history" },
  { href: "/stats", label: "Stats", icon: "stats" },
  { href: "/plan", label: "Plan", icon: "plan" },
  { href: "/reglages", label: "Réglages", icon: "settings" },
] as const;

type IconName = (typeof navigation)[number]["icon"];

function NavigationIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    add: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>,
    stats: <><path d="M4 19V5m0 14h16" /><path d="m7 15 4-4 3 2 5-6" /></>,
    plan: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></>,
  };

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Allure, accueil">
      <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#d2ef9c] text-lg font-black text-[#173d35]">A</span>
      <span>
        <span className="block text-lg font-bold tracking-[-0.04em] text-[#23372f]">allure</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#81877f]">course · musculation</span>
      </span>
    </Link>
  );
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className={mobile ? "grid grid-cols-5" : "space-y-1.5"}>
      {navigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition ${active ? "text-[#245642]" : "text-[#858a82] hover:text-[#365a48]"}`
                : `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-[#eaf2df] text-[#245642]" : "text-[#737b72] hover:bg-[#f4f6f1] hover:text-[#23372f]"}`
            }
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  authSlot,
  authSlotMobile,
}: {
  children: ReactNode;
  authSlot: ReactNode;
  authSlotMobile: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8f4]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#e8e9e1] bg-white px-5 py-7 lg:flex">
        <Brand />
        <div className="mt-12">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a0a49c]">Ton espace</p>
          <NavigationLinks />
        </div>
        <div className="mt-auto rounded-2xl bg-[#f5f7f1] p-4">
          <p className="text-sm font-semibold text-[#34493e]">À ton rythme.</p>
          <p className="mt-1 text-xs leading-5 text-[#7b8178]">Un mouvement après l’autre, c’est déjà avancer.</p>
        </div>
        <div className="mt-4">{authSlot}</div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e8e9e1]/80 bg-[#f7f8f4]/95 px-5 py-3 backdrop-blur lg:hidden">
        <Brand />
        {authSlotMobile}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-7 sm:pt-8 lg:ml-[252px] lg:w-[calc(100%-252px)] lg:px-10 lg:pb-10 lg:pt-10">
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5e8df] bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur lg:hidden">
        <NavigationLinks mobile />
      </div>
    </div>
  );
}
