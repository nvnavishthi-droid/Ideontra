// form-schemas.ts — Preview validation schemas; database rules will remain authoritative.
import { z } from "zod";
import { fieldLimits as limits } from "./form-field-limits";
import { categories } from "@/types/idea";
// Validate optional supporting links as absolute HTTP URLs.
export function validLink(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}
export const ideaSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(limits.title),
  category: z.enum(categories, { error: "Choose a category." }),
  problem: z.string().trim().min(1, "Describe the problem.").max(limits.text),
  solution: z
    .string()
    .trim()
    .min(1, "Describe your proposed solution.")
    .max(limits.text),
  beneficiaries: z
    .string()
    .trim()
    .min(1, "Describe who benefits.")
    .max(limits.text),
  impact: z
    .string()
    .trim()
    .min(1, "Describe the expected impact.")
    .max(limits.text),
  effort: z.string(),
  links: z
    .string()
    .max(limits.links)
    .refine(
      (value) => value.split(/\n/).every(validLink),
      "Enter a valid http or https link on each line.",
    ),
  anonymous: z.boolean(),
});
export type IdeaFormValues = z.infer<typeof ideaSchema>;
export const authSchema = z.object({
  name: z.string().max(limits.name),
  email: z
    .email("Enter a valid email address.")
    .max(limits.email)
    .refine(
      (value) => value.toLowerCase().endsWith("@closefuture.io"),
      "Use your @closefuture.io work email.",
    ),
  password: z.string().min(1, "Enter your password.").max(limits.password),
});
export type AuthValues = z.infer<typeof authSchema>;

// Allow incomplete private drafts while retaining all persisted length caps.
export const draftSchema = ideaSchema.extend({
  title: z.string().max(limits.title),
  category: z.union([z.enum(categories), z.literal("")]),
  problem: z.string().max(limits.text),
  solution: z.string().max(limits.text),
  beneficiaries: z.string().max(limits.text),
  impact: z.string().max(limits.text),
});
