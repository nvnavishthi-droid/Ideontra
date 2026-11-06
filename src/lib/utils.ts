// utils.ts — Combine conditional classes with Tailwind conflict resolution.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// Merge reusable component classes.
export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}
