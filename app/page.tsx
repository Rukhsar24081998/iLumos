import { SetupForm } from "@/components/setup/SetupForm";
import { SetupHero } from "@/components/setup/SetupHero";
import { WorkflowPreview } from "@/components/setup/WorkflowPreview";

/**
 * Screen 1 — Onboarding / Setup.
 * Phase 2: polished first impression with simulated file selection only.
 */
export default function SetupPage() {
  return (
    <div
      data-screenshot="setup"
      className="mx-auto flex w-full max-w-5xl flex-col gap-12 py-6 sm:gap-14 sm:py-10"
    >
      <SetupHero />
      <WorkflowPreview />
      <SetupForm />
    </div>
  );
}
