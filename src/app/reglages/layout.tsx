import { SettingsNav } from "@/components/settings/settings-nav";

export default function ReglagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SettingsNav />
      {children}
    </div>
  );
}
