import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";

type ConnexionPageProps = {
  searchParams: Promise<{ etat?: string }>;
};

async function ConnexionContent({ searchParams }: ConnexionPageProps) {
  const { etat } = await searchParams;

  return (
    <section className="mx-auto max-w-lg rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Ton espace Allure</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f]">Ravi de te retrouver.</h1>
      <p className="mt-3 text-sm leading-6 text-[#747a72]">
        Connecte-toi avec ton adresse email et ton mot de passe. Le lien par email reste
        disponible si tu le préfères.
      </p>
      <SignInForm initialStatus={etat} />
    </section>
  );
}

export default function ConnexionPage(props: ConnexionPageProps) {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-lg rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm text-[#747a72]">Préparation de ta connexion…</p>
        </section>
      }
    >
      <ConnexionContent searchParams={props.searchParams} />
    </Suspense>
  );
}
