import { getActivePlan } from "@/app/actions/plan";
import { PlanAssistant } from "@/components/plan/plan-assistant";
import { PlanDetail } from "@/components/plan/plan-detail";

export async function PlanView() {
  const data = await getActivePlan();

  if (!data || !data.plan) {
    return (
      <div className="space-y-6">
        <div className="rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#23372f]">
            Ton plan d&apos;entraînement
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#747a72]">
            Crée un plan course adapté à ton objectif, à tes disponibilités et à ton
            niveau. Le moteur propose des séances ; tu décides.
          </p>
          <div className="mt-6">
            <PlanAssistant />
          </div>
        </div>
      </div>
    );
  }

  return <PlanDetail data={data} />;
}
