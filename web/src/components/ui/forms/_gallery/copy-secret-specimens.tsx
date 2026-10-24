"use client";

import { Eye, KeyRound } from "lucide-react";
import { useState } from "react";
import { Section, SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "@/app/design/_gallery";
import { cn } from "@/lib/cn";
import { Button } from "../../button";
import { IconButton } from "../../icon-button";
import { CodeBlock } from "../code-block";
import { CONTROL_HEIGHT, controlBox } from "../control-styles";
import { CopyButton } from "../copy-button";
import { Field } from "../field";
import { InlineAlert } from "../inline-alert";
import { SecretReveal } from "../secret-reveal";
import { type WriteOnlySecretResult, WriteOnlySecret } from "../write-only-secret";
import { KeyboardNote } from "./keyboard-note";
import { wait } from "./sample-data";

const FORM_KEY = "3f9a1c7e5b2d4086a1e9c3b7d5f20a64";
const SCRIPT_SNIPPET = `<script src="https://app.example.com/embed.js" data-form="${FORM_KEY}" async></script>`;
const IFRAME_SNIPPET = `<iframe src="https://app.example.com/f/${FORM_KEY}" title="Admission enquiry form" width="100%" height="720" loading="lazy"></iframe>`;
const PAYLOAD = `{
  "event": "lead.created",
  "lead": {
    "number": 10482,
    "full_name": "Arjun Mehta",
    "mobile": "+919876543210",
    "programme": "B.Tech Computer Science",
    "city": "Ahmedabad",
    "source": { "channel": "website", "form": "Admissions 2026" }
  },
  "occurred_at": "2026-10-06T09:00:00Z"
}`;
const API_KEY = "ak_7Hq2Xc.Y9dN4pLmR2vT8wKz6bQe";

/* -------------------------------------------------------------------------------------------------
 * CopyButton
 * -----------------------------------------------------------------------------------------------*/

export function CopyButtonSpecimens() {
  return (
    <Section
      id="copy-button"
      title="CopyButton"
      description="Copies one value in one action. The icon becomes a check for 2 s; the name never changes; the shared polite region says “{Thing} copied” once. If the clipboard is blocked, the source text is selected and a message says to press Ctrl+C."
    >
      <Section id="copy-button-variants" title="Variants" level={3}>
        <StateGrid columns={3}>
          <Specimen label="icon only (with tooltip)">
            <span className="font-mono text-sm text-fg" id="tracking-link">
              https://sce.example.in/t/fair-bhopal
            </span>
            <CopyButton value="https://sce.example.in/t/fair-bhopal" label="Copy tracking link" thing="Tracking link" sourceId="tracking-link" />
          </Specimen>
          <Specimen label="labelled (Button secondary sm, as wide as “Copied”)">
            <CopyButton variant="labelled" text="Copy code" label="Copy code" thing="Embed code" value={SCRIPT_SNIPPET} />
          </Specimen>
          <Specimen label="inline xs (next to a value in a key-value row)">
            <dl className="m-0 flex items-center gap-2 text-sm">
              <dt className="text-muted">Lead number</dt>
              <dd className="m-0 flex items-center gap-1 text-fg">
                #10482
                <CopyButton variant="inline" value="10482" label="Copy lead number" thing="Lead number" />
              </dd>
            </dl>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="copy-button-sizes" title="Sizes" level={3}>
        <StateGrid columns={3}>
          {(["xs", "sm", "md"] as const).map((size) => (
            <Specimen key={size} label={`${size} · ${size === "xs" ? 24 : size === "sm" ? 32 : 40} px`}>
              <CopyButton size={size} look="secondary" value="10482" label="Copy API ID" thing="API ID" />
              <CopyButton size={size} variant="labelled" value="10482" label="Copy" thing="API ID" />
            </Specimen>
          ))}
        </StateGrid>
      </Section>

      <Section id="copy-button-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="idle">
            <CopyButton value={FORM_KEY} label="Copy publisher key" thing="Publisher key" look="secondary" />
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <CopyButton value={FORM_KEY} label="Copy publisher key" thing="Publisher key" look="secondary" className="bg-surface-hover" />
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <CopyButton value={FORM_KEY} label="Copy publisher key" thing="Publisher key" look="secondary" className={simulatedFocus} />
          </Specimen>
          <Specimen label="copied (2 s; same colours, check icon)">
            <CopyButton value={FORM_KEY} label="Copy publisher key" thing="Publisher key" look="secondary" initialState="copied" />
            <CopyButton variant="labelled" text="Copy code" label="Copy code" thing="Embed code" value={SCRIPT_SNIPPET} initialState="copied" />
          </Specimen>
          <Specimen label="failed (clipboard blocked)">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-fg">v=DKIM1; k=rsa; p=MIGfMA0G…</span>
              <CopyButton value="v=DKIM1; k=rsa;" label="Copy DKIM record value" thing="DKIM record value" initialState="failed" />
            </div>
          </Specimen>
          <Specimen label="disabled (nothing to copy yet)">
            <CopyButton value="" label="Copy API key" thing="API key" look="secondary" disabled />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote items={[{ keys: ["Tab"], action: "Then Enter or Space copies. Focus stays on the button." }]} />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * CodeBlock
 * -----------------------------------------------------------------------------------------------*/

export function CodeBlockSpecimens() {
  return (
    <Section
      id="code-block"
      title="CodeBlock"
      description="Code, or a value to paste elsewhere, with one-click copy. One text colour, no syntax colours. The code region is a named, focusable region (arrow keys scroll it), at most 320 px tall, with a fade at the right edge while more is hidden."
    >
      <Section id="code-block-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="tabbed snippets (S31: Script, iframe)" className="sm:col-span-2">
            <CodeBlock
              className="w-full"
              title="Embed code"
              tabs={[
                { value: "script", label: "Script", language: "HTML", code: SCRIPT_SNIPPET },
                { value: "iframe", label: "iframe", language: "HTML", code: IFRAME_SNIPPET },
              ]}
              footer="Paste this into your website where the form should appear."
            />
          </Specimen>
          <Specimen label="single snippet (S37 webhook payload)">
            <CodeBlock className="w-full" title="Payload sample" language="JSON" code={PAYLOAD} />
          </Specimen>
          <Specimen label="inline value (the form link)">
            <Field label="Form link" className="w-full">
              <CodeBlock variant="inline" title="Form link" valueName="form link" value={`https://app.example.com/f/${FORM_KEY}`} />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="code-block-states" title="States" level={3}>
        <StateGrid columns={2}>
          <Specimen label="default">
            <CodeBlock className="w-full" title="Signature header" language="HTTP" code="X-Signature: sha256=8d2f6c1e0b9a7d4e3c2b1a0f9e8d7c6b" />
          </Specimen>
          <Specimen label="overflowing (scrolls both ways, fade at the right)">
            <CodeBlock className="w-full" title="Embed code" language="HTML" code={IFRAME_SNIPPET} />
          </Specimen>
          <Specimen label="copied / copy failed" note="The CopyButton states, in the header">
            <div className="flex flex-wrap gap-2">
              <CopyButton variant="labelled" text="Copy code" label="Copy code" thing="Embed code" value={SCRIPT_SNIPPET} initialState="copied" />
              <CopyButton variant="labelled" text="Copy code" label="Copy code" thing="Embed code" value={SCRIPT_SNIPPET} initialState="failed" />
            </div>
          </Specimen>
          <Specimen label="loading (the form key is being created)">
            <CodeBlock className="w-full" title="Embed code" language="HTML" state="loading" />
          </Specimen>
          <Specimen label="unavailable (the form is turned off)" className="sm:col-span-2">
            <CodeBlock className="w-full" title="Embed code" language="HTML" code={SCRIPT_SNIPPET} state="unavailable" />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Tabs, “Copy code”, then the code region." },
          { keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], action: "In the code region: scroll it." },
          { keys: ["Ctrl + A"], action: "Inside the code region it is not overridden." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * SecretReveal
 * -----------------------------------------------------------------------------------------------*/

function SecretRevealDemo() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Button
        leadingIcon={<KeyRound />}
        onClick={() => {
          setOpen(true);
          setCreated(true);
        }}
      >
        Create API key
      </Button>
      {created && !open ? (
        <p className="m-0 text-sm text-fg">
          Website forms · <span className="font-mono">ak_7Hq2…</span>
        </p>
      ) : null}
      <SecretReveal
        open={open}
        onOpenChange={setOpen}
        title="Your new API key"
        label="API key"
        secret={API_KEY}
        details="Name: Website forms · Access: create and update leads · Created 06 Oct 2026, 2:30 pm IST"
      />
    </div>
  );
}

/** A still picture of the dialog body, masked or shown. */
function SecretBodyPicture({ shown }: { shown: boolean }) {
  const id = shown ? "secret-picture-shown" : "secret-picture-masked";
  return (
    <div className="flex w-full flex-col gap-4">
      <InlineAlert tone="warning">Copy this key now. We only show it once. If you lose it, revoke it and create a new one.</InlineAlert>
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          API key
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={id}
            type={shown ? "text" : "password"}
            readOnly
            value={API_KEY}
            autoComplete="off"
            dir="ltr"
            className={cn("min-w-0 flex-1 px-3 font-mono text-sm", CONTROL_HEIGHT.md, controlBox({ readOnly: true }))}
          />
          <IconButton
            variant="secondary"
            size="md"
            icon={<Eye />}
            aria-label="Show key"
            pressed={shown}
            className="aria-pressed:border-accent aria-pressed:bg-accent-subtle aria-pressed:text-accent"
          />
          <CopyButton variant="labelled" size="md" text="Copy" label="Copy API key" thing="API key" value={API_KEY} initialState={shown ? "copied" : undefined} />
        </div>
      </div>
      <p className="m-0 text-sm text-muted">Name: Website forms · Access: create and update leads · Created 06 Oct 2026, 2:30 pm IST</p>
    </div>
  );
}

async function saveSecret(value: string): Promise<WriteOnlySecretResult> {
  await wait(1200);
  if (value.length < 16) return { ok: false, error: "invalid" };
  return { ok: true, savedOn: "06 Oct 2026" };
}

export function SecretRevealSpecimens() {
  return (
    <Section
      id="secret-reveal"
      title="SecretReveal"
      description="A new secret shown exactly once, inside a dialog: the warning is read on open, focus starts on Copy, and Done before any Copy or Show asks first. Secrets the institution pastes in are write-only: the page shows only that one is saved, and when."
    >
      <Section id="secret-reveal-shown-once" title="Shown once (S37 API key, webhook secret; S41 publisher key)" level={3}>
        <StateGrid columns={2}>
          <Specimen label="live: create a key" note="Try it: press Done without copying">
            <SecretRevealDemo />
          </Specimen>
          <Specimen label="closed (lists show only the prefix)">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th scope="col" className="py-2 font-medium">
                    Key
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 text-fg">
                    Website forms · <span className="font-mono">ak_7Hq2…</span>
                  </td>
                  <td className="py-2 text-muted">06 Oct 2026</td>
                </tr>
              </tbody>
            </table>
          </Specimen>
          <Specimen label="masked (default)" surface="surface-raised">
            <SecretBodyPicture shown={false} />
          </Specimen>
          <Specimen label="shown, copied" surface="surface-raised">
            <SecretBodyPicture shown />
          </Specimen>
          <Specimen label="closing without copying (asks first)" stack>
            <p className="m-0 text-sm font-semibold text-fg">Close without copying?</p>
            <p className="m-0 text-sm text-muted">You won&apos;t be able to see this key again.</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="md">
                Go back
              </Button>
              <Button variant="danger" size="md">
                Close anyway
              </Button>
            </div>
          </Specimen>
          <Specimen label="copy failed" surface="surface-raised">
            <CopyButton variant="labelled" size="md" text="Copy" label="Copy API key" thing="API key" value={API_KEY} initialState="failed" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="secret-reveal-write-only" title="Write-only (S35 SMS keys, S36 gateway keys)" level={3}>
        <StateGrid columns={3}>
          <Specimen label="not set">
            <WriteOnlySecret label="Key secret" savedOn={null} onSave={saveSecret} />
          </Specimen>
          <Specimen label="saved">
            <WriteOnlySecret label="Key secret" savedOn="06 Oct 2026" onSave={saveSecret} />
          </Specimen>
          <Specimen label="replacing" note="Try it: a short secret is rejected; Save takes 1.2 s (saving)">
            <WriteOnlySecret label="Key secret" savedOn="06 Oct 2026" initialReplacing onSave={saveSecret} className="w-full" />
          </Specimen>
          <Specimen label="invalid (format check per provider)">
            <WriteOnlySecret label="Key secret" savedOn="06 Oct 2026" initialReplacing initialError="invalid" onSave={saveSecret} className="w-full" />
          </Specimen>
          <Specimen label="failed">
            <WriteOnlySecret label="Key secret" savedOn="06 Oct 2026" initialReplacing initialError="failed" onSave={saveSecret} className="w-full" />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Input (read-only, selectable), Show, Copy, Done. Focus starts on Copy." },
          { keys: ["Esc"], action: "Acts like Done, and asks first if nothing was copied or shown." },
        ]}
      />
    </Section>
  );
}
