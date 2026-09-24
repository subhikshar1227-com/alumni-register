"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

const TRIANGLE = "polygon(0 0, 100% 0, 50% 100%)"
const FLAG_COLORS = ["#0b5d3b", "#9e1b23", "#d4a017", "#d97706"]

/**
 * A festive string of hanging bunting flags interspersed with glowing lights,
 * inspired by traditional Indian celebration decorations.
 */
export function HangingLights({ className, count = 15 }: { className?: string; count?: number }) {
  return (
    <div className={cn("relative w-full select-none", className)} aria-hidden="true">
      <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
      <div className="flex items-start justify-between px-1">
        {Array.from({ length: count }).map((_, i) => {
          const isBulb = i % 3 === 1
          if (isBulb) {
            return (
              <span
                key={i}
                className="animate-twinkle mt-0.5 block size-2 rounded-full bg-gold-bright"
                style={{ animationDelay: `${(i % 5) * 0.3}s` }}
              />
            )
          }
          return (
            <span
              key={i}
              className="block h-3.5 w-3"
              style={{ clipPath: TRIANGLE, backgroundColor: FLAG_COLORS[i % FLAG_COLORS.length] }}
            />
          )
        })}
      </div>
    </div>
  )
}

/** A small ornamental gold + maroon divider used between sections. */
export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} aria-hidden="true">
      <span className="h-px w-14 bg-gradient-to-r from-transparent to-gold" />
      <span className="size-1.5 rotate-45 bg-maroon" />
      <span className="size-2.5 rotate-45 border border-gold bg-gold/25" />
      <span className="size-1.5 rotate-45 bg-maroon" />
      <span className="h-px w-14 bg-gradient-to-l from-transparent to-gold" />
    </div>
  )
}

/** The decorative mandala emblem, framed in a circular gold ring. */
export function MandalaEmblem({ className, size = 88 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border-2 border-gold bg-green-dark p-2 shadow-lg shadow-green-dark/40 ring-4 ring-maroon/30",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/mandala.png"
        alt=""
        width={size}
        height={size}
        className="size-full object-contain"
        priority
      />
    </span>
  )
}
