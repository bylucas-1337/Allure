import type { Metadata } from "next";
import { Suspense } from "react";

import { PlanView } from "@/components/plan/plan-view";

export const metadata: Metadata = { title: "Plan · Allure" };

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <PlanView />
    </Suspense>
  );
}
