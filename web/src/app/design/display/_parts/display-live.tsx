"use client";

import { useState } from "react";
import { MaskedValue, type RevealResult } from "@/components/ui/display/masked-value";
import { type Step, type StepState, Stepper } from "@/components/ui/display/stepper";
import { Specimen, StateGrid } from "../../_gallery";

const IMPORT_STEPS = ["Upload", "Match columns", "Preview", "Import", "Results"];

function stepsAt(current: number, problem?: number): Step[] {
  return IMPORT_STEPS.map((label, index) => ({
    label,
    state: (index === problem ? "problem" : index < current ? "done" : index === current ? "current" : "upcoming") as StepState,
  }));
}

export function StepperSpecimens() {
  const [current, setCurrent] = useState(2);
  return (
    <div className="flex flex-col gap-4">
      <Specimen label="horizontal (md and up), live" note="Done steps are buttons that go back and keep every value; upcoming steps are text. Below md it stacks vertically." stack>
        <Stepper task="Import" steps={stepsAt(current)} onStepSelect={setCurrent} className="w-full" />
        <button
          type="button"
          onClick={() => setCurrent((step) => Math.min(IMPORT_STEPS.length - 1, step + 1))}
          className="min-h-hit rounded-sm text-sm text-accent underline underline-offset-2"
        >
          Next step
        </button>
      </Specimen>
      <StateGrid columns={3}>
        <Specimen label="vertical (below md, narrow panels)" stack>
          <Stepper task="Import" variant="vertical" steps={stepsAt(1)} onStepSelect={() => {}} />
        </Specimen>
        <Specimen label="problem" note="A done step that now needs a change: CircleAlert and “has problems” (sr-only)." stack>
          <Stepper task="Import" variant="vertical" steps={stepsAt(2, 1)} onStepSelect={() => {}} />
        </Specimen>
        <Specimen label="read-only (after the point of no return)" note="Every step is text." stack>
          <Stepper task="Import" variant="vertical" steps={stepsAt(4)} readOnly />
        </Specimen>
        <Specimen label="compact" note="The merge Dialog footer and narrow screens." stack>
          <Stepper task="Merge" variant="compact" steps={[{ label: "Which record stays?", state: "done" }, { label: "Choose values", state: "current" }, { label: "Check and merge", state: "upcoming" }]} />
        </Specimen>
        <Specimen label="merge steps (horizontal)" stack>
          <Stepper
            task="Merge"
            variant="horizontal"
            steps={[
              { label: "Which record stays?", state: "done" },
              { label: "Choose values", state: "current" },
              { label: "Check and merge", state: "upcoming" },
            ]}
            onStepSelect={() => {}}
            className="w-full"
          />
        </Specimen>
      </StateGrid>
    </div>
  );
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function MaskedValueSpecimens() {
  return (
    <StateGrid columns={3}>
      <Specimen label="masked, no permission" note="A lock icon with the tooltip “Hidden for your role”." stack>
        <MaskedValue kind="phone" masked="+91 ••••• •3210" hint="3210" className="text-sm" />
      </Specimen>
      <Specimen label="masked, can reveal (live)" note="Show is recorded in the audit log; focus stays on the button, which becomes Hide." stack>
        <MaskedValue
          kind="phone"
          masked="+91 ••••• •3210"
          hint="3210"
          className="text-sm"
          onReveal={async (): Promise<RevealResult> => {
            await wait(700);
            return { ok: true, display: "+91 98765 43210", copy: "+919876543210" };
          }}
        />
      </Specimen>
      <Specimen label="email, can reveal (live)" stack>
        <MaskedValue
          kind="email"
          label="Email"
          masked="pr•••@gmail.com"
          hint="priya.r.2007@gmail.com"
          className="text-sm"
          onReveal={async (): Promise<RevealResult> => {
            await wait(700);
            return { ok: true, display: "priya.r.2007@gmail.com", copy: "priya.r.2007@gmail.com" };
          }}
        />
      </Specimen>
      <Specimen label="reveal failed (live)" note="“Couldn't show it. Try again.” inline." stack>
        <MaskedValue
          kind="phone"
          label="Guardian's mobile"
          masked="+91 ••••• •7788"
          hint="7788"
          className="text-sm"
          onReveal={async (): Promise<RevealResult> => {
            await wait(600);
            return { ok: false, reason: "failed" };
          }}
        />
      </Specimen>
      <Specimen label="reveal denied (live)" note="Permission changed: “You no longer have access to this.” and the button goes." stack>
        <MaskedValue
          kind="phone"
          masked="+91 ••••• •5678"
          hint="5678"
          className="text-sm"
          onReveal={async (): Promise<RevealResult> => {
            await wait(600);
            return { ok: false, reason: "denied" };
          }}
        />
      </Specimen>
      <Specimen label="revealing (live)" note="Press Show: it stays in “Showing…” here, because this reveal never answers." stack>
        <MaskedValue kind="phone" masked="+91 ••••• •3210" hint="3210" className="text-sm" onReveal={() => new Promise<RevealResult>(() => {})} />
      </Specimen>
      <Specimen label="in a table cell (S05)" note="Never offers Show: the full value is never sent to a table." stack>
        <MaskedValue kind="phone" masked="+91 ••••• •3210" hint="3210" className="text-table" />
      </Specimen>
      <Specimen label="UAE number" stack>
        <MaskedValue kind="phone" masked="+971 •• ••• 4567" hint="4567" className="text-sm" />
      </Specimen>
      <Specimen label="empty" stack>
        <MaskedValue kind="phone" masked={null} className="text-sm" />
      </Specimen>
    </StateGrid>
  );
}
