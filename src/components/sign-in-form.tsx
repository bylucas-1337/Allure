"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Feedback = { kind: "success" | "error"; message: string };
type Mode = "password" | "magic";

/**
 * Traduit les erreurs Supabase les plus fréquentes en messages utiles.
 * Supabase limite l'envoi d'emails (2 par heure avec son service intégré).
 */
function friendlyError(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect. Vérifie la casse du mot de passe.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Trop de liens demandés en peu de temps. Le service d’email de Supabase limite les envois à environ 2 par heure : patiente un peu, puis réessaie. Ton lien précédent reste peut-être valable dans ta boîte mail.";
  }

  if (message.includes("invalid email") || message.includes("unable to validate email")) {
    return "Cette adresse email ne semble pas valide. Vérifie-la, puis réessaie.";
  }

  if (message.includes("signups not allowed") || message.includes("signup is disabled")) {
    return "Les inscriptions sont fermées. Utilise l’adresse du compte déjà créé.";
  }

  if (message.includes("email not confirmed")) {
    return "Ce compte n’est pas encore confirmé. Dans Supabase, ouvre Authentication → Users et confirme l’utilisateur.";
  }

  return rawMessage;
}

export function SignInForm({ initialStatus }: { initialStatus?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(
    initialStatus === "connecte"
      ? { kind: "success", message: "Connexion réussie. Tu peux reprendre ton parcours." }
      : initialStatus === "erreur"
        ? { kind: "error", message: "Le lien n’a pas pu être vérifié. Demande-en un nouveau." }
        : null,
  );
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setFeedback(null);
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setFeedback({ kind: "error", message: friendlyError(error.message) });
        return;
      }

      // Les cookies de session sont posés par le client Supabase : on rafraîchit
      // pour que le serveur lise la nouvelle session avant d'afficher l'accueil.
      router.replace("/");
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? friendlyError(error.message) : "La connexion a échoué. Réessaie.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: new URL("/auth/callback", window.location.origin).toString(),
        },
      });

      if (error) {
        setFeedback({ kind: "error", message: friendlyError(error.message) });
        return;
      }

      setFeedback({
        kind: "success",
        message: "Le lien de connexion vient d’être envoyé. Pense à vérifier tes courriers indésirables.",
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? friendlyError(error.message) : "La connexion a échoué. Réessaie.",
      });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none transition placeholder:text-[#a0a69e] focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]";

  return (
    <div className="mt-7">
      <div
        role="group"
        aria-label="Mode de connexion"
        className="grid grid-cols-2 gap-1 rounded-xl bg-[#f2f4ec] p-1"
      >
        <button
          type="button"
          aria-pressed={mode === "password"}
          onClick={() => switchMode("password")}
          className={`min-h-10 rounded-lg text-sm font-semibold transition ${
            mode === "password"
              ? "bg-white text-[#23372f] shadow-sm"
              : "text-[#6f776e] hover:text-[#34493e]"
          }`}
        >
          Mot de passe
        </button>
        <button
          type="button"
          aria-pressed={mode === "magic"}
          onClick={() => switchMode("magic")}
          className={`min-h-10 rounded-lg text-sm font-semibold transition ${
            mode === "magic"
              ? "bg-white text-[#23372f] shadow-sm"
              : "text-[#6f776e] hover:text-[#34493e]"
          }`}
        >
          Lien par email
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34493e]">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="toi@exemple.fr"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#34493e]">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ton mot de passe"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl bg-[#245642] px-5 text-sm font-bold text-white transition hover:bg-[#173d35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245642] disabled:cursor-wait disabled:opacity-65"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLinkSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34493e]">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="toi@exemple.fr"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl bg-[#245642] px-5 text-sm font-bold text-white transition hover:bg-[#173d35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245642] disabled:cursor-wait disabled:opacity-65"
          >
            {loading ? "Envoi en cours…" : "Recevoir mon lien de connexion"}
          </button>
          <p className="text-xs leading-5 text-[#8a9088]">
            Le service d’email de Supabase limite les envois à environ 2 par heure.
          </p>
        </form>
      )}

      {feedback && (
        <p
          role="status"
          className={`mt-5 rounded-xl px-4 py-3 text-sm leading-6 ${
            feedback.kind === "success"
              ? "bg-[#edf5e6] text-[#315d3d]"
              : "bg-[#fff1e8] text-[#9a412b]"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
