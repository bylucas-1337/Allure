import Link from "next/link";

export function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Jalon 1</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f]">{title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#747a72]">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-[#d9ddd2] bg-[#fafbf8] p-5">
        <p className="text-sm font-medium text-[#646d64]">Cet espace est prêt à être complété dans un prochain jalon.</p>
      </div>
      <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-[#32634f] underline decoration-[#b8d5b9] underline-offset-4">
        Revenir à l’accueil
      </Link>
    </section>
  );
}
