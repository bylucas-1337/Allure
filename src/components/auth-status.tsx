import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

/**
 * Affiche le compte connecté et le bouton de déconnexion.
 *
 * Ce composant lit la session : il doit rester à l'intérieur d'un
 * <Suspense> dans le layout (Cache Components).
 */
export async function AuthStatus({ compact = false }: { compact?: boolean }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link
        href="/connexion"
        className={
          compact
            ? "rounded-full border border-[#dce2d7] bg-white px-3 py-2 text-xs font-semibold text-[#32634f] transition hover:bg-[#f4f6f1]"
            : "inline-flex text-sm font-semibold text-[#32634f] underline decoration-[#b8d5b9] underline-offset-4 hover:text-[#173d35]"
        }
      >
        Se connecter
      </Link>
    );
  }

  const fullEmail = user.email ?? "Compte connecté";
  const shortEmail = user.email?.split("@")[0] ?? "Compte";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="max-w-24 truncate text-xs font-semibold text-[#34493e]"
          title={fullEmail}
        >
          {shortEmail}
        </span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-full border border-[#dce2d7] bg-white px-3 py-2 text-xs font-semibold text-[#32634f] transition hover:bg-[#f4f6f1]"
          >
            Quitter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="border-t border-[#eef0e8] pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a0a49c]">
        Connecté
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-[#34493e]" title={fullEmail}>
        {fullEmail}
      </p>
      <form action={signOutAction} className="mt-2">
        <button
          type="submit"
          className="text-xs font-semibold text-[#32634f] underline decoration-[#b8d5b9] underline-offset-4 transition hover:text-[#173d35]"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
