// Icon.tsx — The only Lucide import and typed icon entry point.
import {
  Lightbulb,
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowBigUp,
  MessageSquare,
  Ellipsis,
  Columns3,
  List,
  ListFilter,
  ArrowDownWideNarrow,
  Bookmark,
  ExternalLink,
  Play,
  Upload,
  Check,
  Circle,
  CircleCheck,
  CircleAlert,
  LoaderCircle,
  CalendarDays,
  Search,
  LogOut,
  ArrowRight,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
const icons = {
  lightbulb: Lightbulb,
  plus: Plus,
  x: X,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  vote: ArrowBigUp,
  comment: MessageSquare,
  more: Ellipsis,
  board: Columns3,
  list: List,
  filter: ListFilter,
  sort: ArrowDownWideNarrow,
  bookmark: Bookmark,
  external: ExternalLink,
  play: Play,
  upload: Upload,
  check: Check,
  circle: Circle,
  success: CircleCheck,
  alert: CircleAlert,
  loader: LoaderCircle,
  calendar: CalendarDays,
  search: Search,
  logout: LogOut,
  arrow: ArrowRight,
} as const;
export type IconName = keyof typeof icons;
interface IconProps extends LucideProps {
  name: IconName;
}
// Render one mapped icon with consistent accessible defaults.
export function Icon({ name, ...props }: IconProps) {
  const Glyph = icons[name];
  return <Glyph aria-hidden="true" size={16} strokeWidth={1.75} {...props} />;
}
