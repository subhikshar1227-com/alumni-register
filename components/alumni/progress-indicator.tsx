"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

type ProgressIndicatorProps = {
  sections: string[]
  currentSection: string
}

export function ProgressIndicator({ sections, currentSection }: ProgressIndicatorProps) {
  const currentIndex = sections.indexOf(currentSection)
  const percent = ((currentIndex + 1) / sections.length) * 100

  return (
    <div className="w-full">
      {/* Segmented labels — desktop / larger screens */}
      <div className="mb-3 hidden items-center justify-between gap-1 sm:flex">
        {sections.map((section, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          return (
            <div key={section} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center justify-center">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[0.7rem] font-bold transition-all",
                    done && "border-gold bg-green-deep text-cream",
                    active && "border-gold bg-gold text-green-dark",
                    !done && !active && "border-gold/40 bg-ivory text-brown/50",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
                </span>
              </div>
              <span
                className={cn(
                  "text-center text-[0.68rem] font-semibold uppercase leading-tight tracking-wide",
                  active ? "text-maroon" : done ? "text-green-deep" : "text-brown/50",
                )}
              >
                {section}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full border border-gold/40 bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-green-deep via-green-deep to-gold transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Compact label — mobile */}
      <p className="mt-2 text-xs font-medium text-brown/70 sm:hidden">
        <span className="font-bold uppercase tracking-wide text-maroon">{currentSection}</span>
        {"  ·  "}
        Step {currentIndex + 1} of {sections.length}
      </p>
    </div>
  )
}
