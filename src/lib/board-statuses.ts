// board-statuses.ts — Display every workflow status without implying public drafts.
import { statuses, type View, type Status } from "@/types/idea";
// Include the private Draft column only within authorized My Ideas results.
export function getBoardStatuses(view: View): readonly Status[] {
  return view === "my" ? statuses : statuses.filter((status) => status !== "Draft");
}
