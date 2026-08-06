/**
 * Hero copy for the onboarding / setup screen.
 */
export function SetupHero() {
  return (
    <section className="mx-auto max-w-3xl space-y-5 pt-2 text-center sm:space-y-6 sm:pt-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-orange-600">
        Patent claim chart refinement
      </p>
      <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.1]">
        Refine Patent Claim Charts with AI
      </h1>
      <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
        Upload an existing claim chart and supporting documents, then collaborate
        with AI to strengthen evidence, improve reasoning, and prepare claim charts
        for legal review.
      </p>
      <div
        aria-hidden
        className="mx-auto h-1 w-12 rounded-full bg-orange-500"
      />
    </section>
  );
}
