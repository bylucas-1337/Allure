import type { Metadata } from "next";
import type { Viewport } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthStatus } from "@/components/auth-status";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Allure — ton espace mouvement",
    template: "%s · Allure",
  },
  description: "Un espace simple et motivant pour suivre la course et la musculation.",
  applicationName: "Allure",
  appleWebApp: {
    capable: true,
    title: "Allure",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f8f4",
};

const authFallback = (
  <span
    aria-hidden="true"
    className="block h-8 w-24 animate-pulse rounded-full bg-[#eef1e8]"
  />
);

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">
        <ServiceWorkerRegistration />
        <AppShell
          authSlot={
            <Suspense fallback={authFallback}>
              <AuthStatus />
            </Suspense>
          }
          authSlotMobile={
            <Suspense fallback={authFallback}>
              <AuthStatus compact />
            </Suspense>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
