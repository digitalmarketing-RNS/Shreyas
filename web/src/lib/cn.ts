import { clsx, type ClassValue } from "clsx";
import { twMerge } from "@/styles/tw-merge";

/**
 * Joins class names and resolves Tailwind conflicts, later classes winning.
 *
 * Uses the twMerge that build_tokens.py generates (src/styles/tw-merge.ts), which knows our token
 * utilities: cn("h-control-sm", "h-control-md") keeps only h-control-md, and
 * cn("text-table", "text-muted") keeps both (a size and a colour), where the stock tailwind-merge
 * would drop text-table.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
