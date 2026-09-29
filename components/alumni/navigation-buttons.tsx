"use client"

import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react"

type NavigationButtonsProps = {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  showBack?: boolean
  isLast?: boolean
  disabled?: boolean
}

export function NavigationButtons({
  onBack,
  onNext,
  nextLabel = "Continue",
  showBack = true,
  isLast = false,
  disabled = false,
}: NavigationButtonsProps) {
  return (
    <div className="mt-8 flex items-center gap-3">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "flex h-13 items-center justify-center gap-2 rounded-xl border-2 border-maroon/60 bg-ivory px-5 text-base font-semibold text-maroon transition-colors",
            "hover:bg-maroon hover:text-cream active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-maroon/25",
          )}
        >
          <ArrowLeft className="size-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className={cn(
          "flex h-13 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gold-bright bg-green-deep px-6 text-base font-semibold text-cream shadow-md transition-colors",
          "hover:bg-green-dark active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50",
          "disabled:pointer-events-none disabled:opacity-60",
        )}
      >
        {nextLabel}
        {isLast ? <PartyPopper className="size-5" /> : <ArrowRight className="size-5" />}
      </button>
    </div>
  )
}
