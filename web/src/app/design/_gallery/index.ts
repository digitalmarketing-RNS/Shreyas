/**
 * Shared helpers for the /design gallery. Every section page uses them, so variants and states
 * look and read the same everywhere:
 *
 *   <GalleryPage title="Forms" description="…">
 *     <Section id="text-input" title="TextInput">
 *       <StateGrid columns={4}>
 *         <Specimen label="default">…</Specimen>
 *         <Specimen label="disabled">…</Specimen>
 *       </StateGrid>
 *     </Section>
 *   </GalleryPage>
 *
 * Hover, active and focus-visible cannot be held still for a screenshot, so specimens draw them
 * with the classes those states apply (simulatedStates) and say so in the caption note.
 */
export { GalleryPage } from "./gallery-page";
export { Section } from "./section";
export { Specimen, type SpecimenSurface } from "./specimen";
export { StateGrid } from "./state-grid";
export { GALLERY_SECTIONS, type GallerySection } from "./sections";
export { SIMULATED_NOTE, simulatedFocus } from "./simulated";
