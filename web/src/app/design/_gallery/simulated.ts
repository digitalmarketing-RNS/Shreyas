/**
 * Classes that draw interaction states in a still specimen. A real :focus-visible ring cannot be
 * held for a screenshot, so the focus specimen gets the same outline the base layer gives
 * :focus-visible (2 px focus-ring, 2 px offset).
 */
export const simulatedFocus = "outline-2 outline-offset-2 outline-focus-ring outline-solid";

/** Caption note for specimens that draw a state with its classes. */
export const SIMULATED_NOTE = "Drawn with the state's classes";
