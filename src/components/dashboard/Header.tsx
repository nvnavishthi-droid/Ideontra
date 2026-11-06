// Header.tsx — Brand header with verified employee identity and sign-out.
"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/api/auth";
import { Icon } from "@/components/icons/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/shared/Loaders";
import {
  FeedbackDialog,
  type Feedback,
} from "@/components/shared/FeedbackDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { AuthIdentity } from "@/types/auth";
// Show the authenticated employee and clear user-specific caches on sign-out.
export function Header({ user }: { user: AuthIdentity }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const mutation = useMutation({
    mutationFn: signOut,
    onSuccess(result) {
      if (result.error) {
        setFeedback({ title: "Sign-out failed", message: result.error });
        return;
      }
      queryClient.clear();
      window.location.replace("/auth");
    },
    onError() {
      setFeedback({
        title: "Sign-out failed",
        message: "Unable to connect. Please try again.",
      });
    },
  });
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <header className="border-b bg-card">
      <div className="app-container flex h-16 items-center gap-3">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="inline-flex items-baseline gap-2 text-lg font-semibold"
          >
            <Icon name="lightbulb" size={22} className="self-center text-primary" />
            <span>CloseFuture</span>
          </Link>
          <span className="hidden text-xs text-muted-foreground md:inline">
            Ideas &amp; Innovation Board
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="secondary" className="rounded-full font-normal">
            {user.role === "admin" ? "Admin" : "Member"}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                aria-label="Open account menu"
              >
                {initials}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuLabel className="font-normal">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuItem
                disabled={mutation.isPending}
                onSelect={() => mutation.mutate()}
              >
                {mutation.isPending ? <ButtonLoader /> : <Icon name="logout" />}
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <FeedbackDialog feedback={feedback} onClose={() => setFeedback(null)} />
    </header>
  );
}
