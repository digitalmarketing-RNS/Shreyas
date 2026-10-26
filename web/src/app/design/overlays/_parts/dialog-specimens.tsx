"use client";

import { ArrowRightLeft, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { DescriptionList } from "@/components/ui/display/description-list";
import { Stepper } from "@/components/ui/display/stepper";
import { Alert } from "@/components/ui/feedback/alert";
import { JobProgress } from "@/components/ui/feedback/job-progress";
import type { Job } from "@/components/ui/feedback/jobs";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { useToast } from "@/components/ui/feedback/toaster";
import { ConfirmDialog, ConfirmDialogPreview, DISCARD_CHANGES } from "@/components/ui/overlays/confirm-dialog";
import { Dialog, DialogCancel, DialogPreview } from "@/components/ui/overlays/dialog";
import { Specimen, StateGrid } from "../../_gallery";
import { StaticPreview } from "../../shell/_kit/static-preview";
import { FieldDraw, GallerySelect, GalleryTextarea } from "./gallery-fields";

const STAGES = ["New enquiry", "Interested", "Counselling done", "Applied", "Not interested"] as const;

const MERGE_STEPS = ["Which record stays?", "Choose values", "Check and merge"];

const REASSIGN_JOB: Job = {
  id: "job-reassign",
  kind: "bulk_reassign",
  count: 240,
  status: "running",
  total: 240,
  totals: { requested: 240, updated: 96, failed: 0 },
  startedAt: "2:30 pm",
  etaText: "About 1 min left",
};

/** The S09 change-stage form: dirty check, submitting, success toast, and the two error forms. */
function ChangeStageDialog({ mode, label }: { mode: "ok" | "server-error" | "blocked" | "loading"; label: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<string>("Interested");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const dirty = stage !== "Interested" || remark !== "";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "blocked" || mode === "loading") return;
    setSubmitting(true);
    setError(false);
    window.setTimeout(() => {
      setSubmitting(false);
      if (mode === "server-error") {
        setError(true);
        return;
      }
      setOpen(false);
      toast({ tone: "success", title: `Stage changed to ${stage}` });
    }, 1200);
  };

  const blockedReason = mode === "blocked" ? "Only Priya Nair and admins can change it." : mode === "loading" ? "Loading…" : undefined;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setStage("Interested");
          setRemark("");
          setError(false);
        }
      }}
      trigger={<Button variant="secondary" size="sm" leadingIcon={<ArrowRightLeft />}>{label}</Button>}
      title="Change stage for Ananya Rao"
      description="The lead's current stage is Interested."
      size="md"
      dirty={dirty}
      submitting={submitting}
      loading={mode === "loading"}
      onSubmit={submit}
      footer={
        <>
          <DialogCancel />
          <Button type="submit" variant="primary" size="md" loading={submitting} loadingLabel="Saving…" disabledReason={blockedReason}>
            Save stage
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <Alert tone="danger" live="focused" title="Couldn't save the stage">
            The lead was changed by Vikram Shah a moment ago. Reload it to see the latest, then try again.
          </Alert>
        ) : null}
        {mode === "blocked" ? <Alert messageKey="stage_locked" /> : null}
        {mode === "loading" ? (
          <div className="flex flex-col gap-4">
            <Skeleton shape="title" />
            <Skeleton shape="card" className="h-control-md" />
            <Skeleton shape="title" />
            <Skeleton shape="card" className="h-20" />
          </div>
        ) : (
          <>
            <GallerySelect label="Stage" value={stage} onChange={setStage} options={STAGES} />
            <GalleryTextarea label="Remark" value={remark} onChange={setRemark} />
          </>
        )}
      </div>
    </Dialog>
  );
}

function MergeWizardDialog() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setStep(0);
      }}
      trigger={<Button variant="secondary" size="sm">Wizard dialog (lg)</Button>}
      title="Merge duplicate leads"
      size="lg"
      dirty={step > 0}
      footerStart={<Stepper variant="compact" task="Merge" steps={MERGE_STEPS.map((label, index) => ({ label, state: index < step ? "done" : index === step ? "current" : "upcoming" }))} />}
      footer={
        <>
          {step > 0 ? (
            <Button variant="secondary" size="md" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <DialogCancel />
          )}
          <Button variant="primary" size="md" onClick={() => (step < 2 ? setStep(step + 1) : setOpen(false))}>
            {step < 2 ? "Next" : "Merge leads"}
          </Button>
        </>
      }
    >
      <h3 tabIndex={-1} className="m-0 mb-3 text-sm font-semibold text-fg">
        {MERGE_STEPS[step]}
      </h3>
      <DescriptionList
        variant="side-by-side"
        items={[
          { label: "Lead #10482", value: "Ananya Rao · ananya.rao@gmail.com · created 03 Oct 2026" },
          { label: "Lead #10377", value: "Ananya R. · +91 98765 43210 · created 28 Sept 2026" },
        ]}
      />
    </Dialog>
  );
}

function ResultDialog() {
  return (
    <Dialog
      trigger={<Button variant="secondary" size="sm">Result dialog</Button>}
      title="Reassign 240 leads"
      size="lg"
      footer={<DialogCancel>Close</DialogCancel>}
    >
      <JobProgress job={REASSIGN_JOB} onCancel={() => new Promise((resolve) => window.setTimeout(resolve, 800))} />
    </Dialog>
  );
}

function ReadOnlyDialog() {
  return (
    <Dialog trigger={<Button variant="secondary" size="sm">Read-only dialog (sm)</Button>} title="Payment #PAY-2026-0418" size="sm" footer={<DialogCancel>Close</DialogCancel>}>
      <DescriptionList
        columns={1}
        items={[
          { label: "Amount", value: "₹25,000.00" },
          { label: "Paid by", value: "UPI · Arjun Mehta" },
          { label: "Paid at", value: "06 Oct 2026, 1:50 pm IST" },
        ]}
      />
    </Dialog>
  );
}

export function DialogLiveSpecimens() {
  return (
    <Specimen label="live" note="Type in a field, then press Esc: the discard prompt opens. An overlay click on a changed dialog does nothing." stack>
      <div className="flex flex-wrap gap-2">
        <ChangeStageDialog mode="ok" label="Form dialog (md)" />
        <ChangeStageDialog mode="server-error" label="Server error" />
        <ChangeStageDialog mode="blocked" label="Blocked by rule" />
        <ChangeStageDialog mode="loading" label="Loading content" />
        <MergeWizardDialog />
        <ResultDialog />
        <ReadOnlyDialog />
      </div>
    </Specimen>
  );
}

const footer = (primary: string, options: { loading?: boolean; reason?: string } = {}) => (
  <>
    <Button variant="secondary" size="md">
      Cancel
    </Button>
    <Button variant="primary" size="md" loading={options.loading} loadingLabel="Saving…" disabledReason={options.reason}>
      {primary}
    </Button>
  </>
);

const STAGE_FIELDS = (
  <div className="flex flex-col gap-4">
    <FieldDraw label="Stage" value="Counselling done" />
    <FieldDraw label="Remark" value="Spoke to her father; visiting on Saturday." />
  </div>
);

export function DialogStaticSpecimens() {
  return (
    <div className="flex flex-col gap-4">
      <StateGrid columns={3}>
        <Specimen label="size sm (400 px)" surface="bg">
          <StaticPreview>
            <DialogPreview size="sm" title="Add follow-up" footer={footer("Add follow-up")}>
              <FieldDraw label="When" value="07 Oct 2026, 10:00 am" />
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="opening and closing" note="Opens with rise-in (opacity and an 8 px rise, 240 ms); closes with fade-out. Under reduced motion it fades in place." surface="bg">
          <StaticPreview>
            <DialogPreview size="sm" title="Add follow-up" className="opacity-60" footer={footer("Add follow-up")}>
              <FieldDraw label="When" value="07 Oct 2026, 10:00 am" />
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="full-screen sheet (md and lg below sm)" note="inset-0, square corners; the footer keeps clear of the home indicator." surface="bg">
          <StaticPreview className="h-112 w-full max-w-90 overflow-hidden rounded-lg border border-border">
            <DialogPreview sheet title="Change stage for Ananya Rao" footer={footer("Save stage")}>
              {STAGE_FIELDS}
            </DialogPreview>
          </StaticPreview>
        </Specimen>
      </StateGrid>
      <Specimen label="size md (560 px): open" surface="bg">
        <StaticPreview>
          <DialogPreview size="md" title="Change stage for Ananya Rao" description="The lead's current stage is Interested." footer={footer("Save stage")}>
            {STAGE_FIELDS}
          </DialogPreview>
        </StaticPreview>
      </Specimen>
      <Specimen label="size lg (800 px): wizard, step 2 of 3" surface="bg">
        <StaticPreview>
          <DialogPreview
            size="lg"
            title="Merge duplicate leads"
            footerStart={<Stepper variant="compact" task="Merge" steps={MERGE_STEPS.map((label, index) => ({ label, state: index === 0 ? "done" : index === 1 ? "current" : "upcoming" }))} />}
            footer={
              <>
                <Button variant="secondary" size="md">
                  Back
                </Button>
                <Button variant="primary" size="md">
                  Next
                </Button>
              </>
            }
          >
            <DescriptionList
              variant="side-by-side"
              items={[
                { label: "Name", value: "Ananya Rao (lead #10482)" },
                { label: "Mobile number", value: "+91 98765 43210 (lead #10377)" },
                { label: "Course", value: "B.Tech Computer Science (both)" },
              ]}
            />
          </DialogPreview>
        </StaticPreview>
      </Specimen>
      <StateGrid columns={2}>
        <Specimen label="loading content" note="Skeleton fields of the final size; the primary is aria-disabled with “Loading…”." surface="bg">
          <StaticPreview>
            <DialogPreview size="md" title="Change stage for Ananya Rao" loading footer={footer("Save stage", { reason: "Loading…" })}>
              <div className="flex flex-col gap-4">
                <Skeleton shape="title" />
                <Skeleton shape="card" className="h-control-md" />
                <Skeleton shape="title" />
                <Skeleton shape="card" className="h-20" />
              </div>
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="dirty: closing asks first" note="Esc, the close button or Cancel opens the discard prompt on top." surface="bg">
          <StaticPreview className="relative">
            <DialogPreview size="md" title="Change stage for Ananya Rao" footer={footer("Save stage")}>
              {STAGE_FIELDS}
            </DialogPreview>
            <div className="absolute inset-0 flex items-center justify-center bg-overlay p-4">
              <ConfirmDialogPreview
                title={DISCARD_CHANGES.title}
                description={DISCARD_CHANGES.description}
                confirmLabel={DISCARD_CHANGES.confirmLabel}
                cancelLabel={DISCARD_CHANGES.cancelLabel}
              />
            </div>
          </StaticPreview>
        </Specimen>
        <Specimen label="submitting" note="The primary loads; Esc, the overlay and close are ignored (close is aria-disabled with “Saving…”)." surface="bg">
          <StaticPreview>
            <DialogPreview size="md" title="Change stage for Ananya Rao" submitting footer={footer("Save stage", { loading: true })}>
              {STAGE_FIELDS}
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="server error" note="A danger Alert at the top of the body; focus moves to it (no live role), nothing typed is lost." surface="bg">
          <StaticPreview>
            <DialogPreview size="md" title="Change stage for Ananya Rao" footer={footer("Save stage")}>
              <div className="flex flex-col gap-4">
                <Alert tone="danger" title="Couldn't save the stage">
                  The lead was changed by Vikram Shah a moment ago. Reload it to see the latest, then try again.
                </Alert>
                {STAGE_FIELDS}
              </div>
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="server error: generic" surface="bg">
          <StaticPreview>
            <DialogPreview size="md" title="Reassign 240 leads" footer={footer("Reassign 240 leads")}>
              <Alert tone="danger" title="Something went wrong on our side">
                Your changes are still here. Try again in a moment. Ref: 7F3K-21
              </Alert>
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="blocked by rule" note="A warning Alert explains the rule; the primary is aria-disabled with the same reason." surface="bg">
          <StaticPreview>
            <DialogPreview size="md" title="Change stage for Ananya Rao" footer={footer("Save stage", { reason: "Only Priya Nair and admins can change it." })}>
              <div className="flex flex-col gap-4">
                <Alert messageKey="stage_locked" />
                <FieldDraw label="Stage" value="Applied" />
              </div>
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="result" note="JobProgress in the body; only “Close”; the job continues in the tray." surface="bg">
          <StaticPreview>
            <DialogPreview size="md" title="Reassign 240 leads" footer={<Button variant="secondary" size="md">Close</Button>}>
              <JobProgress job={REASSIGN_JOB} announce={false} />
            </DialogPreview>
          </StaticPreview>
        </Specimen>
        <Specimen label="read-only" note="Details with only “Close”." surface="bg">
          <StaticPreview>
            <DialogPreview size="sm" title="Payment #PAY-2026-0418" footer={<Button variant="secondary" size="md">Close</Button>}>
              <DescriptionList
                columns={1}
                items={[
                  { label: "Amount", value: "₹25,000.00" },
                  { label: "Paid by", value: "UPI · Arjun Mehta" },
                ]}
              />
            </DialogPreview>
          </StaticPreview>
        </Specimen>
      </StateGrid>
    </div>
  );
}

export function ConfirmLiveSpecimens() {
  const { toast } = useToast();
  const [failOnce, setFailOnce] = useState(true);
  return (
    <Specimen label="live" note="Focus starts on Cancel, so Enter alone never destroys. The overlay does not close it." stack>
      <div className="flex flex-wrap gap-2">
        <ConfirmDialog
          trigger={<Button variant="danger-outline" size="sm" leadingIcon={<Trash2 />}>Delete 312 leads</Button>}
          title="Delete 312 leads?"
          description="They'll be hidden from every list and report. Their payments and consent records are kept. You can't undo this."
          confirmLabel="Delete 312 leads"
          confirmingLabel="Deleting…"
          typedConfirmation="312"
          onConfirm={() => new Promise<void>((resolve) => window.setTimeout(resolve, 1000)).then(() => void toast({ tone: "success", title: "312 leads deleted" }))}
        />
        <ConfirmDialog
          trigger={<Button variant="secondary" size="sm">Revoke API key</Button>}
          title="Revoke this API key?"
          description="Any system using it will stop sending leads at once."
          confirmLabel="Revoke key"
          confirmingLabel="Revoking…"
          onConfirm={() =>
            new Promise<void>((resolve, reject) =>
              window.setTimeout(() => {
                if (failOnce) {
                  setFailOnce(false);
                  reject(new Error("We couldn't reach the server. Nothing was changed. Try again."));
                } else resolve();
              }, 900),
            )
          }
        />
        <ConfirmDialog
          trigger={<Button variant="secondary" size="sm">Cancel broadcast</Button>}
          title="Cancel this broadcast?"
          description="Messages already sent stay sent. The rest won't go out."
          confirmLabel="Cancel broadcast"
          cancelLabel="Keep sending"
          onConfirm={() => {}}
        />
        <ConfirmDialog
          trigger={<Button variant="primary" size="sm">Send now</Button>}
          tone="primary"
          title="Send this broadcast now?"
          description="1,240 leads will get the 'Open day invite' template on WhatsApp."
          confirmLabel="Send now"
          confirmingLabel="Sending…"
          onConfirm={() => new Promise<void>((resolve) => window.setTimeout(resolve, 900))}
        />
        <ConfirmDialog
          trigger={<Button variant="secondary" size="sm">Discard changes</Button>}
          title={DISCARD_CHANGES.title}
          description={DISCARD_CHANGES.description}
          confirmLabel={DISCARD_CHANGES.confirmLabel}
          cancelLabel={DISCARD_CHANGES.cancelLabel}
          onConfirm={() => {}}
        />
      </div>
    </Specimen>
  );
}

export function ConfirmStaticSpecimens() {
  return (
    <StateGrid columns={3}>
      <Specimen label="destructive: open" surface="bg">
        <StaticPreview>
          <ConfirmDialogPreview
            title="Delete 312 leads?"
            description="They'll be hidden from every list and report. Their payments and consent records are kept. You can't undo this."
            confirmLabel="Delete 312 leads"
          />
        </StaticPreview>
      </Specimen>
      <Specimen label="non-destructive" note="Primary confirm." surface="bg">
        <StaticPreview>
          <ConfirmDialogPreview
            tone="primary"
            title="Send this broadcast now?"
            description="1,240 leads will get the 'Open day invite' template on WhatsApp."
            confirmLabel="Send now"
          />
        </StaticPreview>
      </Specimen>
      <Specimen label="discard changes" note="The one discard prompt for forms, dialogs and drawers." surface="bg">
        <StaticPreview>
          <ConfirmDialogPreview
            title={DISCARD_CHANGES.title}
            description={DISCARD_CHANGES.description}
            confirmLabel={DISCARD_CHANGES.confirmLabel}
            cancelLabel={DISCARD_CHANGES.cancelLabel}
          />
        </StaticPreview>
      </Specimen>
      <Specimen label="typed: not matching" note="The confirm is aria-disabled with the reason “Type 312 to confirm”." surface="bg">
        <StaticPreview>
          <ConfirmDialogPreview
            title="Delete 312 leads?"
            description="They'll be hidden from every list and report. Their payments and consent records are kept. You can't undo this."
            confirmLabel="Delete 312 leads"
            typedConfirmation="312"
            typed="31"
          />
        </StaticPreview>
      </Specimen>
      <Specimen label="confirming" note="The confirm loads; Cancel and Esc are ignored until it finishes." surface="bg">
        <StaticPreview>
          <ConfirmDialogPreview title="Revoke this API key?" description="Any system using it will stop sending leads at once." confirmLabel="Revoke key" confirmingLabel="Revoking…" confirming />
        </StaticPreview>
      </Specimen>
      <Specimen label="error" note="A danger Alert inside the panel; the panel stays open." surface="bg">
        <StaticPreview>
          <ConfirmDialogPreview
            title="Revoke this API key?"
            description="Any system using it will stop sending leads at once."
            confirmLabel="Revoke key"
            error="We couldn't reach the server. Nothing was changed. Try again."
          />
        </StaticPreview>
      </Specimen>
    </StateGrid>
  );
}

