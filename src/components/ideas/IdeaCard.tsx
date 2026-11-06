// IdeaCard.tsx — Aligned Pencil card and role-aware overflow actions.
"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/Icon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ideaActions } from "@/lib/idea-actions";
import type { Idea, IdeaAction, Role } from "@/types/idea";
export interface IdeaInteractions {
  onOpen: (idea: Idea) => void;
  onAction: (idea: Idea, action: IdeaAction) => void;
}
// Render consistent two-line title space and a keyboard-accessible card.
export function IdeaCard({
  idea,
  role,
  onOpen,
  onAction,
}: IdeaInteractions & { idea: Idea; role: Role }) {
  return (
    <article className="panel flex flex-col gap-3 p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{idea.category}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${idea.title || "Untitled draft"}`}
            >
              <Icon name="more" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onOpen(idea)}>
                View details
              </DropdownMenuItem>
              {ideaActions(idea, role).map((option) => (
                <DropdownMenuItem
                  key={option.action}
                  onSelect={() => onAction(idea, option.action)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <button
        onClick={() => onOpen(idea)}
        className="idea-title text-left font-medium leading-5 hover:text-primary"
      >
        {idea.title || "Untitled draft"}
      </button>
      <p className="min-h-10 line-clamp-2 text-xs leading-5 text-muted-foreground">
        {idea.problem || "Private draft · add details before submitting."}
      </p>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={idea.status} />
      </div>
      <div className="mt-auto flex items-center gap-3 text-xs">
        <span className="flex items-center gap-2">
          <Icon name="vote" className="text-muted-foreground" />
          {idea.votes}
        </span>
        <button
          onClick={() => onOpen(idea)}
          aria-label={`${idea.comments} comments on ${idea.title || "Untitled draft"}`}
          className="flex items-center gap-2"
        >
          <Icon name="comment" className="text-muted-foreground" />
          {idea.comments}
        </button>
        <span className="ml-auto truncate text-muted-foreground">
          {idea.author}
        </span>
      </div>
    </article>
  );
}
