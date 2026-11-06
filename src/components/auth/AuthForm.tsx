// AuthForm.tsx — Employee sign-in/signup screen with Supabase authentication.
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticate } from "@/lib/api/auth";
import { ButtonLoader } from "@/components/shared/Loaders";
import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema, type AuthValues } from "@/lib/form-schemas";
import { fieldLimits } from "@/lib/form-field-limits";
import { filterName } from "@/lib/form-input-filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/FormField";
import {
  FeedbackDialog,
  type Feedback,
} from "@/components/shared/FeedbackDialog";
// Render authentication states with shared validation and popup feedback.
export function AuthForm() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ values, signup }: { values: AuthValues; signup: boolean }) =>
      authenticate(values, signup),
    onSuccess(result) {
      if (result.error) {
        setFeedback({ title: "Authentication failed", message: result.error });
        return;
      }
      queryClient.clear();
      window.location.replace("/");
    },
    onError() {
      setFeedback({
        title: "Authentication failed",
        message: "Unable to connect. Please try again.",
      });
    },
  });
  const [signup, setSignup] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    setError,
    clearErrors,
    setValue,
    formState: { errors },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  // Validate the signup name before submitting the authentication action.
  function submit(values: AuthValues) {
    if (signup && !values.name.trim()) {
      setError("name", { message: "Enter your full name." });
      setFocus("name");
      return;
    }
    mutation.mutate({ values, signup });
  }
  // Focus and reveal the first invalid authentication field.
  function invalid(fields: FieldErrors<AuthValues>) {
    const first = Object.keys(fields)[0] as keyof AuthValues;
    setFocus(first);
    document.getElementById(first)?.scrollIntoView({ block: "center" });
  }
  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <section className="panel flex w-full max-w-md flex-col gap-4 p-6 sm:p-8">
        <p className="text-lg font-semibold">CloseFuture</p>
        <h1 className="text-2xl font-semibold">Ideas start with you.</h1>
        <p className="text-muted-foreground">
          {signup
            ? "Create your employee account."
            : "Sign in to the Ideas & Innovation Board."}
        </p>
        <div className="flex gap-3">
          <Button
            variant={signup ? "outline" : "default"}
            onClick={() => {
              setSignup(false);
              clearErrors();
            }}
          >
            Sign in
          </Button>
          <Button
            variant={signup ? "default" : "outline"}
            onClick={() => {
              setSignup(true);
              clearErrors();
            }}
          >
            Sign up
          </Button>
        </div>
        <form
          noValidate
          onSubmit={handleSubmit(submit, invalid)}
          className="flex flex-col gap-4"
        >
          <FieldGroup className="gap-4">
            {signup && (
              <FormField
                id="name"
                label="Full name"
                error={errors.name?.message}
              >
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Your name"
                  maxLength={fieldLimits.name}
                  {...register("name")}
                  onChange={(e) =>
                    setValue("name", filterName(e.target.value), {
                      shouldValidate: false,
                    })
                  }
                  onInput={(e) => {
                    e.currentTarget.value = filterName(e.currentTarget.value);
                  }}
                  aria-invalid={!!errors.name}
                />
              </FormField>
            )}
            <FormField
              id="email"
              label="Work email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@closefuture.io"
                maxLength={fieldLimits.email}
                {...register("email")}
                aria-invalid={!!errors.email}
              />
            </FormField>
            <FormField
              id="password"
              label="Password"
              error={errors.password?.message}
            >
              <Input
                id="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder="••••••••••••"
                maxLength={fieldLimits.password}
                {...register("password")}
                aria-invalid={!!errors.password}
              />
            </FormField>
          </FieldGroup>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="self-start"
          >
            {mutation.isPending && <ButtonLoader />}
            {signup ? "Create account" : "Sign in"}
          </Button>
        </form>
      </section>
      <FeedbackDialog feedback={feedback} onClose={() => setFeedback(null)} />
    </main>
  );
}
