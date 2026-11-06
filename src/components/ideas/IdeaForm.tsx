// IdeaForm.tsx — Full create/edit/resubmit form matching the Pencil submission popup.
"use client";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLiveMutation } from "@/hooks/use-live-mutation";
import { saveIdea } from "@/lib/api/ideas";
import { MutationFeedback } from "@/components/shared/MutationFeedback";
import { ButtonLoader } from "@/components/shared/Loaders";
import {
  ideaSchema,
  draftSchema,
  type IdeaFormValues,
} from "@/lib/form-schemas";
import { fieldLimits as limits } from "@/lib/form-field-limits";
import { categories, type Idea } from "@/types/idea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/FormField";
import { Select } from "@/components/shared/Select";
interface IdeaFormProps {
  idea?: Idea;
  resubmit?: boolean;
  onClose: () => void;
  onSaved: () => void;
}
const textFields = [
  {
    key: "problem",
    label: "Problem",
    placeholder: "What problem should we solve?",
  },
  {
    key: "solution",
    label: "Proposed solution",
    placeholder: "How could we solve it?",
  },
  {
    key: "beneficiaries",
    label: "Who benefits",
    placeholder: "Who will this help?",
  },
  {
    key: "impact",
    label: "Expected impact",
    placeholder: "What will improve?",
  },
] as const;
// Persist idea input while preserving entered values after failed saves.
export function IdeaForm({ idea, resubmit, onClose, onSaved }: IdeaFormProps) {
  const {
    register,
    handleSubmit,
    setFocus,
    setError,
    getValues,
    formState: { errors },
  } = useForm<IdeaFormValues>({
    resolver: zodResolver(ideaSchema),
    defaultValues: {
      title: idea?.title ?? "",
      category: (idea?.category ?? "") as IdeaFormValues["category"],
      problem: idea?.problem ?? "",
      solution: idea?.solution ?? "",
      beneficiaries: idea?.beneficiaries ?? "",
      impact: idea?.impact ?? "",
      effort: idea?.effort ?? "",
      links: idea?.links ?? "",
      anonymous: idea?.anonymous ?? false,
    },
  });
  const mutation = useLiveMutation(
    ({ values, submit }: { values: IdeaFormValues; submit: boolean }) =>
      saveIdea(values, idea?.id, submit),
    onSaved,
  );
  // Save partial private drafts without running submit-only mandatory checks.
  function saveDraft() {
    const parsed = draftSchema.safeParse(getValues());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const key = issue.path[0] as keyof IdeaFormValues;
      setError(key, { message: issue.message });
      setFocus(key);
      return;
    }
    mutation.mutate({ values: parsed.data as IdeaFormValues, submit: false });
  }
  // Scroll and focus the first invalid field in the shared validation flow.
  function invalid(fields: FieldErrors<IdeaFormValues>) {
    const first = Object.keys(fields)[0] as keyof IdeaFormValues;
    setFocus(first);
    document
      .getElementById(first)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        if (idea?.status === "Draft" && !resubmit) {
          event.preventDefault();
          saveDraft();
        } else
          void handleSubmit(
            (values) =>
              mutation.mutate({ values, submit: !!resubmit || !idea }),
            invalid,
          )(event);
      }}
      className="flex flex-col gap-5"
    >
      <MutationFeedback
        feedback={mutation.feedback}
        onClose={() => mutation.setFeedback(null)}
      />
      <fieldset
        disabled={mutation.isPending}
        className="flex flex-col gap-5 border-0 p-0"
      >
        <FieldGroup className="gap-4">
          <FormField id="title" label="Title *" error={errors.title?.message}>
            <Input
              id="title"
              maxLength={limits.title}
              placeholder="A short, clear idea title · maximum 100 characters"
              {...register("title")}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
          </FormField>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <FormField
              id="category"
              label="Category *"
              error={errors.category?.message}
            >
              <Select
                id="category"
                options={categories}
                placeholder="Select category"
                {...register("category")}
                aria-invalid={!!errors.category}
              />
            </FormField>
            <FormField id="effort" label="Rough effort">
              <Select
                id="effort"
                options={["Small", "Medium", "Large"]}
                placeholder="Optional"
                {...register("effort")}
              />
            </FormField>
          </div>
          {textFields.slice(0, 2).map((field) => (
            <FormField
              key={field.key}
              id={field.key}
              label={`${field.label} *`}
              error={errors[field.key]?.message}
            >
              <Textarea
                id={field.key}
                maxLength={limits.text}
                placeholder={field.placeholder}
                {...register(field.key)}
                aria-invalid={!!errors[field.key]}
              />
            </FormField>
          ))}
          <div className="grid items-start gap-4 sm:grid-cols-2">
            {textFields.slice(2).map((field) => (
              <FormField
                key={field.key}
                id={field.key}
                label={`${field.label} *`}
                error={errors[field.key]?.message}
              >
                <Textarea
                  id={field.key}
                  maxLength={limits.text}
                  placeholder={field.placeholder}
                  {...register(field.key)}
                  aria-invalid={!!errors[field.key]}
                />
              </FormField>
            ))}
          </div>
          <FormField
            id="links"
            label="Links (optional)"
            error={errors.links?.message}
          >
            <Textarea
              id="links"
              maxLength={limits.links}
              placeholder="Add supporting links, one per line"
              {...register("links")}
              aria-invalid={!!errors.links}
            />
          </FormField>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              {...register("anonymous")}
            />
            Submit anonymously
          </label>
          <p className="text-xs text-muted-foreground">
            Your name is hidden from Members and visible to Admins.
          </p>
        </FieldGroup>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          {!idea && (
            <Button variant="outline" type="button" onClick={saveDraft}>
              Save draft
            </Button>
          )}
          <Button type="submit">
            {mutation.isPending && <ButtonLoader />}
            {resubmit
              ? "Save and resubmit"
              : idea
                ? "Save changes"
                : "Submit idea"}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
