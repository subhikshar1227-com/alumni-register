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
      <div className="h-px w-full bg-gold/70" />
      <div className="flex items-start justify-between px-1">
        {Array.from({ length: count }).map((_, i) => {
          const isBulb = i % 3 === 1
          if (isBulb) {
            return (
              <span
                key={i}
                className="animate-twinkle mt-1 block size-1.5 rounded-full bg-gold-bright"
                style={{ animationDelay: `${(i % 5) * 0.35}s` }}
              />
            )
          }
          return (
            <span
              key={i}
              className="block h-3 w-2.5"
              style={{ clipPath: TRIANGLE, backgroundColor: FLAG_COLORS[i % FLAG_COLORS.length] }}
            />
          )
        })}
      </div>
    </div>
  )
}

/** A small ornamental rule used between sections, styled after a printed hairline. */
export function OrnamentalDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2.5", className)} aria-hidden="true">
      <span className="h-px w-10 bg-gold/60" />
      <span className="font-display text-[0.7rem] leading-none text-maroon">❈</span>
      <span className="h-px w-10 bg-gold/60" />
    </div>
  )
}

/** The college crest — a green-ink institutional mark, printed straight onto the page. */
export function LogoEmblem({ className, size = 88 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo-crest.png"
      alt="SVCE Bengaluru"
      width={size}
      height={Math.round(size * (161 / 131))}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: "auto" }}
      priority
    />
  )
}
