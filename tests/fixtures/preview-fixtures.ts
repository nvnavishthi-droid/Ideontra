// preview-fixtures.ts — Server-only illustrative records transcribed from Pencil.
import "server-only";
import type { Idea, Status } from "@/types/idea";
const samples: [
  string,
  string,
  Status,
  number,
  number,
  boolean,
  string | null,
][] = [
  [
    "Streamline team onboarding",
    "Internal Tool",
    "Submitted",
    8,
    2,
    true,
    null,
  ],
  [
    "A shared learning library",
    "Training",
    "Needs More Info",
    5,
    2,
    false,
    null,
  ],
  [
    "Automate weekly reporting",
    "Process Improvement",
    "Under Evaluation",
    12,
    6,
    false,
    null,
  ],
  [
    "Reusable proposal toolkit",
    "New Service Offering",
    "Approved",
    7,
    2,
    false,
    "Priya S.",
  ],
  [
    "Client feedback hub",
    "Client Experience",
    "In Progress",
    9,
    4,
    false,
    "Priya S.",
  ],
  [
    "Monthly community sessions",
    "Marketing/Content",
    "Parked",
    4,
    1,
    false,
    "Rahul M.",
  ],
  [
    "Internal knowledge search",
    "Internal Tool",
    "Done",
    6,
    3,
    false,
    "Rahul M.",
  ],
  ["Improve onboarding checklist", "Internal Tool", "Draft", 0, 0, false, null],
  [
    "Reusable proposal templates",
    "Process Improvement",
    "Draft",
    0,
    0,
    false,
    null,
  ],
  ["Team learning newsletter", "Training", "Rejected", 2, 1, false, null],
  [
    "Shared client directory",
    "Client Experience",
    "Withdrawn",
    1,
    1,
    false,
    null,
  ],
  [
    "A better project handover",
    "Process Improvement",
    "Submitted",
    3,
    1,
    false,
    null,
  ],
];
// Produce sample records on the server; actual authors never live in client fixtures.
export function previewFixtures(): Idea[] {
  return samples.map(
    ([title, category, status, votes, comments, anonymous, owner], index) => ({
      id: `idea-${index + 1}`,
      title,
      category,
      status,
      votes,
      comments,
      anonymous,
      owner,
      author: anonymous
        ? "Rahul M."
        : index === 1 || status === "Draft"
          ? "Priya S."
          : "Rahul M.",
      isAuthor: false,
      problem:
        "New joiners spend time finding the tools and information they need.",
      solution:
        "Create one shared checklist with links, contacts, and setup steps.",
      beneficiaries: "New team members and onboarding buddies.",
      impact: "A clearer first week and fewer repeated setup questions.",
      effort: "Small",
      links: "",
      followed: [0, 2, 5].includes(index),
      voted: false,
      impactScore: ["Approved", "In Progress", "Done", "Parked"].includes(
        status,
      )
        ? 4
        : null,
      effortScore: ["Approved", "In Progress", "Done", "Parked"].includes(
        status,
      )
        ? 2
        : null,
      quadrant: ["Approved", "In Progress", "Done", "Parked"].includes(status)
        ? "Quick Win"
        : null,
      targetDate: owner ? "2026-11-02" : null,
      overdue: status === "In Progress",
      submittedAt: `2026-10-${String(28 + (index % 3)).padStart(2, "0")}T09:00:00Z`,
      updatedAt: "2026-11-01T10:30:00Z",
      reason:
        status === "Needs More Info"
          ? "Please explain who benefits and how impact will be measured."
          : status === "Parked"
            ? "Capacity is allocated to current commitments."
            : status === "Rejected"
              ? "This duplicates an existing team initiative."
              : undefined,
      outcome:
        status === "Done"
          ? "The shared checklist is now available to the team."
          : undefined,
    }),
  );
}
