export function SchemaWarning() {
  return (
    <div className="rounded-[1.75rem] border border-[#f0d3c4] bg-[#fff1e8] p-5 text-sm leading-6 text-[#9a412b]">
      <p className="font-semibold">La base n’a pas encore les nouvelles colonnes.</p>
      <p className="mt-1">
        Colle les fichiers{" "}
        <code className="rounded bg-white/70 px-1.5 py-0.5">
          supabase/migrations/20261119010000_v2_programme.sql
        </code>{" "}
        et{" "}
        <code className="rounded bg-white/70 px-1.5 py-0.5">
          supabase/migrations/20261119020000_v3_run_profile.sql
        </code>{" "}
        dans le SQL Editor de Supabase, puis recharge cette page.
      </p>
    </div>
  );
}
