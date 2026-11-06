// Modal.tsx — Accessible reusable dialog with focus trapping and full-screen overlay.
"use client";
import { useRef, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}
// Preserve dashboard context while presenting a scrollable popup.
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
}: ModalProps) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        onOpenAutoFocus={() => {
          returnFocus.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          if (returnFocus.current?.isConnected) {
            event.preventDefault();
            returnFocus.current.focus();
          }
        }}
        className={cn(
          "dialog-body gap-5 shadow-none",
          wide ? "sm:max-w-4xl" : "sm:max-w-2xl",
        )}
      >
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="leading-normal">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
