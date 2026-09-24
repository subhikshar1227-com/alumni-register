"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { ReactNode } from "react"

type ChoiceCardProps = {
  selected: boolean
  onSelect: () => void
  title: string
  description?: string
  emoji?: string
  icon?: ReactNode
  className?: string
}

export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  emoji,
  icon,
  className,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left shadow-sm transition-all duration-200",
        "hover:shadow-md active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40",
        selected
          ? "border-gold bg-green-deep text-cream shadow-md shadow-green-dark/25"
          : "border-gold/50 bg-ivory hover:border-gold hover:bg-gold/[0.07]",
        className,
      )}
    >
      {(emoji || icon) && (
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors",
            selected ? "bg-cream/15 ring-1 ring-gold/40" : "bg-gold/15",
          )}
          aria-hidden="true"
        >
          {icon ?? emoji}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-base font-semibold",
            selected ? "text-cream" : "text-green-deep",
          )}
        >
          {title}
        </span>
        {description && (
          <span className={cn("mt-0.5 block text-sm", selected ? "text-cream/80" : "text-brown/70")}>
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected ? "border-gold bg-gold text-green-dark" : "border-gold/60 bg-transparent",
        )}
        aria-hidden="true"
      >
        {selected && <Check className="size-4" strokeWidth={3} />}
      </span>
    </button>
  )
}
