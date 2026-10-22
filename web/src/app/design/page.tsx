import type { Metadata } from "next";
import { cn } from "@/lib/cn";
import { GalleryPage, Section, Specimen, StateGrid, simulatedFocus } from "./_gallery";
import { ColorRoles } from "./_gallery/color-roles";
import { MotionScale, RadiusScale, ShadowScale, SizeScale, SpacingScale, TypeScale } from "./_gallery/token-scales";

export const metadata: Metadata = { title: "Tokens" };

export default function TokensPage() {
  return (
    <GalleryPage
      title="Design tokens"
      description={
        <p>
          Every colour, size and duration below comes from <code className="font-mono text-xs">tokens.json</code> and{" "}
          <code className="font-mono text-xs">tokens.dark.json</code> through the generated{" "}
          <code className="font-mono text-xs">src/styles</code> files. Values are read live from the page, so they show the
          theme you are in. Components use these utilities only: no raw colours, no Tailwind default palette.
        </p>
      }
    >
      <Section
        id="colour"
        title="Colour roles"
        description="Roles, not brand colours: rebranding changes values, never names. Each card shows the utility, the current value and the contrast of the pairs the role is used in (4.5:1 for text, 3:1 for control edges, focus rings and chart marks)."
      >
        <ColorRoles />
      </Section>

      <Section
        id="type"
        title="Type scale"
        description="Inter for the staff app, with ₹ in the preloaded file. Each text-* utility sets size, line height and a default weight."
      >
        <TypeScale />
      </Section>

      <Section id="spacing" title="Spacing" description="A 4 px base. The steps match Tailwind's numbers: p-4 is 16 px.">
        <SpacingScale />
      </Section>

      <Section id="radius" title="Radius">
        <RadiusScale />
      </Section>

      <Section id="shadow" title="Elevation" description="Raised surfaces are bg-surface-raised with a border and a shadow.">
        <ShadowScale />
      </Section>

      <Section id="sizes" title="Control sizes and targets">
        <SizeScale />
      </Section>

      <Section
        id="focus"
        title="Focus"
        description="Every :focus-visible element gets a 2 px focus-ring outline with a 2 px offset; inside rows and menus the offset is −2 px (focus-inset). Tab through this page to see the real ring."
      >
        <StateGrid columns={3}>
          <Specimen label="outer ring (default)" note="Drawn with the state's classes">
            <span className={cn("inline-flex h-control-sm items-center rounded-md border border-strong px-3 text-sm text-fg", simulatedFocus)}>
              Export
            </span>
          </Specimen>
          <Specimen label="inset ring (focus-inset)" note="Rows, menu items, listbox options">
            <span className={cn("flex h-menu-item w-full items-center rounded-sm bg-surface-hover px-2 text-sm text-fg", simulatedFocus, "outline-offset-(--focus-inset)")}>
              Ravi Kumar · Follow-up today
            </span>
          </Specimen>
          <Specimen label="inset ring on an accent fill" note="The ring takes on-accent there">
            <span className="inline-flex h-control-sm items-center rounded-md bg-accent px-3 text-sm font-medium text-on-accent outline-2 outline-offset-(--focus-inset) outline-on-accent outline-solid">
              Selected
            </span>
          </Specimen>
        </StateGrid>
      </Section>

      <Section
        id="motion"
        title="Motion"
        description="Nothing in the staff app animates for more than 300 ms, loading indicators apart. Anything that moves sits behind motion-safe:."
      >
        <MotionScale />
      </Section>
    </GalleryPage>
  );
}
