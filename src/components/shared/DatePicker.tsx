// DatePicker.tsx — Full calendar with month/year selectors and selected-day feedback.
"use client";
import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/Icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}
// Let the user browse complete months and select an exact date.
export function DatePicker({ value, onChange, invalid }: DatePickerProps) {
  const [month, setMonth] = useState(() =>
    value ? new Date(`${value}T12:00:00`) : new Date(),
  );
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const currentYear = new Date().getFullYear();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id="targetDate"
          aria-invalid={invalid}
          className="w-full justify-between"
        >
          <span>
            {selected ? format(selected, "dd MMMM yyyy") : "Choose a date"}
          </span>
          <Icon name="calendar" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-4">
        <div className="mb-3 flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <Icon name="chevron-left" />
          </Button>
          <div className="relative inline-flex h-10 items-center gap-2 rounded-md border border-input px-2 focus-within:ring-2 focus-within:ring-ring">
            <span aria-hidden="true">{format(month, "MMMM")}</span>
            <Icon name="chevron-down" />
            <select
              aria-label="Calendar month"
              className="absolute inset-0 size-full appearance-none opacity-0"
              value={month.getMonth()}
              onChange={(e) =>
                setMonth(
                  new Date(month.getFullYear(), Number(e.target.value), 1),
                )
              }
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index}>
                  {format(new Date(2026, index, 1), "MMMM")}
                </option>
              ))}
            </select>
          </div>
          <div className="relative inline-flex h-10 items-center gap-2 rounded-md border border-input px-2 focus-within:ring-2 focus-within:ring-ring">
            <span aria-hidden="true">{month.getFullYear()}</span>
            <Icon name="chevron-down" />
            <select
              aria-label="Calendar year"
              className="absolute inset-0 size-full appearance-none opacity-0"
              value={month.getFullYear()}
              onChange={(e) =>
                setMonth(new Date(Number(e.target.value), month.getMonth(), 1))
              }
            >
              {Array.from(
                { length: 31 },
                (_, index) => currentYear - 10 + index,
              ).map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <Icon name="chevron-right" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <span
              key={day}
              className="py-2 text-center text-xs text-muted-foreground"
            >
              {day}
            </span>
          ))}
          {days.map((day) => (
            <button
              type="button"
              key={day.toISOString()}
              aria-label={format(day, "dd MMMM yyyy")}
              aria-pressed={!!selected && isSameDay(selected, day)}
              className={cn(
                "h-9 rounded-md text-center text-sm hover:bg-accent",
                !isSameMonth(day, month) && "text-muted-foreground",
                selected &&
                  isSameDay(selected, day) &&
                  "bg-primary text-primary-foreground hover:bg-primary",
              )}
              onClick={() => {
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
              }}
            >
              {format(day, "d")}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {selected
            ? `Selected: ${format(selected, "dd MMMM yyyy")}`
            : "Select a target date"}
        </p>
      </PopoverContent>
    </Popover>
  );
}
