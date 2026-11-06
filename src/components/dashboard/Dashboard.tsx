// Dashboard.tsx — Assemble Pencil dashboard views and preserve context behind popups.
"use client";
import { useState, useCallback } from "react";
import { useIdeaRealtime } from "@/hooks/use-idea-realtime";
import { DemoViewer } from "@/components/ideas/DemoViewer";
import { Header } from "./Header";
import { Filters } from "./Filters";
import { DashboardResults } from "./DashboardResults";
import { AdminOverview } from "./AdminOverview";
import { IdeaForm } from "@/components/ideas/IdeaForm";
import { IdeaDetail } from "@/components/ideas/IdeaDetail";
import { WorkflowForm, actionLabels } from "@/components/ideas/WorkflowForm";
import { Modal } from "@/components/shared/Modal";
import {
  FeedbackDialog,
  type Feedback,
} from "@/components/shared/FeedbackDialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/Icon";
import { ResultsLoader } from "@/components/shared/Loaders";
import { Pagination } from "@/components/shared/Pagination";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import type { Idea, IdeaAction, IdeaPage } from "@/types/idea";
import type { AuthIdentity } from "@/types/auth";
interface DashboardProps {
  user: AuthIdentity;
  data: IdeaPage;
  review: Idea[];
  overdue: Idea[];
  loading?: boolean;
  loadError?: string;
  onRetry: () => void;
}
// Render all dashboard views within a single route and action dialogs over it.
export function Dashboard({ user, data, review, overdue, loading, loadError, onRetry }: DashboardProps) {
  const { filters, total } = data;
  const { navigate, pending } = useDashboardNavigation();
  const [selected, setSelected] = useState<Idea | null>(null);
  const [action, setAction] = useState<IdeaAction | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const admin = filters.role === "admin";
  const title =
    filters.view === "review"
      ? "Review ideas"
      : filters.view === "overdue"
        ? "Overdue ideas"
        : "Ideas dashboard";
  // Open an idea's detail without navigating away from the dashboard.
  function open(idea: Idea) {
    setSelected(idea);
    setAction(null);
  }
  // Open one permitted action from a card or detail popup.
  function act(idea: Idea, next: IdeaAction) {
    setSelected(idea);
    setAction(next);
  }
  // Close the current action and return to its detail context.
  function close() {
    if (creating) {
      setCreating(false);
      return;
    }
    if (action) {
      setAction(null);
      return;
    }
    setSelected(null);
  }
  const liveError = useCallback(
    (message: string) => setFeedback({ title: "Live updates", message }),
    [],
  );
  useIdeaRealtime(user, liveError);
  // Close the completed action and confirm that the database accepted it.
  function saved() {
    setCreating(false);
    setSelected(null);
    setAction(null);
    setFeedback({
      title: "Saved",
      message: "Your changes have been saved.",
      success: true,
    });
  }
  const modalTitle = creating
    ? "Submit an idea"
    : action
      ? actionLabels[action]
      : filters.view === "review" && admin
        ? "Review idea"
        : (selected?.title ?? "Idea details");
  return (
    <>
      <div className="dashboard-shell">
      <Header user={user} />
      <main className="app-container dashboard-workspace">
        <div className="dashboard-heading flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground">
              {filters.view === "review"
                ? "Evaluate ideas and help the best ones move forward."
                : filters.view === "overdue"
                  ? "Keep approved work moving toward completion."
                  : "Capture a spark. Build something that matters."}
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" />
            Submit idea
          </Button>
        </div>
        <div className="dashboard-controls">
          <nav aria-label="Dashboard views" className="flex flex-wrap gap-3">
            <Button
              variant={filters.view === "all" ? "default" : "outline"}
              onClick={() => navigate({ view: "all", status: "", q: "", sort: "" })}
            >
              All ideas
            </Button>
            <Button
              variant={filters.view === "my" ? "default" : "outline"}
              onClick={() =>
                navigate({ view: "my", status: "", q: "", sort: "" })
              }
            >
              My Ideas
            </Button>
            {admin && (
              <>
                <Button
                  variant={filters.view === "admin" ? "default" : "outline"}
                  onClick={() => navigate({ view: "admin", status: "", q: "" })}
                >
                  Admin Overview
                </Button>
                <Button
                  variant={filters.view === "review" ? "default" : "outline"}
                  onClick={() =>
                    navigate({
                      view: "review",
                      sort: "",
                      status: "",
                      q: "",
                    })
                  }
                >
                  Review ideas
                </Button>
                <Button
                  variant={filters.view === "overdue" ? "default" : "outline"}
                  onClick={() =>
                    navigate({
                      view: "overdue",
                      sort: "",
                      status: "",
                      q: "",
                    })
                  }
                >
                  Overdue ideas
                </Button>
              </>
            )}
          </nav>
          {filters.view === "my" && (
            <>
              <div
                className="flex flex-wrap gap-3"
                role="tablist"
                aria-label="My Ideas tabs"
              >
                {[
                  ["drafts", "Drafts"],
                  ["submissions", "My Submissions"],
                  ["owned", "Owned by me"],
                  ["following", "Following"],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    role="tab"
                    aria-selected={filters.personal === value}
                    variant={filters.personal === value ? "default" : "outline"}
                    onClick={() => navigate({ tab: value, status: "" })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {filters.personal === "drafts" && (
                <p className="text-xs text-muted-foreground">
                  Drafts are visible only to you.
                </p>
              )}
            </>
          )}
          {filters.view !== "admin" && (
            <Filters
              key={`${filters.view}-${filters.personal}-${filters.q}`}
              filters={filters}
              total={total}
            />
          )}
        </div>
        {loading || loadError ? (
          loadError ? (
            <section className="panel results-scroll flex flex-col items-center justify-center gap-3" role="alert">
              <p>{loadError}</p>
              <Button onClick={onRetry}>Try again</Button>
            </section>
          ) : (
            <div className="dashboard-results" aria-busy="true">
              <ResultsLoader
                variant={filters.view === "admin" ? "admin" :
                  filters.layout === "board" ? "board" : "table"}
                boardColumns={filters.view === "my" ? 10 : 9}
                extraColumn={filters.view === "review" || filters.view === "overdue"} />
              {filters.view !== "admin" && <Pagination page={filters.page}
                pageSize={filters.pageSize} total={total} shown={0} />}
            </div>
          )
        ) : filters.view === "admin" ? (
          <section
            className="dashboard-overview"
            aria-label="Admin overview content"
          >
            <AdminOverview
              counts={data.counts}
              categoryCounts={data.categoryCounts}
              review={review}
              overdue={overdue}
              onOpen={open}
            />
          </section>
        ) : (
          <DashboardResults
            data={data}
            onOpen={open}
            onAction={act}
            pending={pending}
          />
        )}
      </main>
      </div>
      <Modal
        open={creating || !!selected}
        title={modalTitle}
        description={
          creating
            ? "Share the problem, your solution, and the difference it could make."
            : selected
              ? `${selected.status} · ${admin ? "Admin" : "Member"}${selected.isAuthor ? " · Your idea" : ""}`
              : ""
        }
        onClose={close}
        wide={!creating && !action}
      >
        {creating ? (
          <IdeaForm onClose={close} onSaved={saved} />
        ) : selected && action ? (
          action === "edit" || action === "resubmit" ? (
            <IdeaForm
              key={`${selected.id}-${action}`}
              idea={selected}
              resubmit={action === "resubmit"}
              onClose={close}
              onSaved={saved}
            />
          ) : action === "demo" ? (
            <DemoViewer idea={selected} onClose={close} />
          ) : (
            <WorkflowForm
              key={`${selected.id}-${action}`}
              idea={selected}
              admin={admin}
              action={action}
              onClose={close}
              onSaved={saved}
            />
          )
        ) : selected ? (
          <IdeaDetail
            key={selected.id}
            idea={selected}
            role={filters.role}
            onAction={act}
            onClose={close}
          />
        ) : null}
      </Modal>
      <FeedbackDialog feedback={feedback} onClose={() => setFeedback(null)} />
    </>
  );
}
