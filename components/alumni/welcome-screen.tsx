"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import { HangingLights, MandalaEmblem, OrnamentalDivider } from "./festive-decor"

type WelcomeScreenProps = {
  onStart: () => void
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="festive-bg flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="animate-fade-up w-full max-w-md">
        <div className="festive-panel festive-motif overflow-hidden rounded-[1.75rem] px-6 pb-8 pt-5 text-center sm:px-8">
          <HangingLights className="mb-7" />

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-maroon">
            <Sparkles className="size-3.5 text-gold" />
            Silver Jubilee · 25 Years
          </div>

          {/* Emblem */}
          <div className="mb-6 flex justify-center">
            <MandalaEmblem size={92} />
          </div>

          <h1 className="text-balance font-display text-3xl font-bold leading-tight text-green-deep sm:text-4xl">
            Welcome Back, SVCE Alumni!
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-pretty text-base leading-relaxed text-brown">
            Let&apos;s reconnect, reminisce and celebrate the journey together.
          </p>

          <OrnamentalDivider className="my-6" />

          {/* Title card */}
          <div className="rounded-2xl border border-gold/60 bg-cream/70 p-6 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-widest text-maroon">
              You&apos;re invited to
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-green-deep">
              Silver Jubilee Alumni Registration
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-brown/80">
              This quick registration helps the college reconnect with its alumni community and
              welcome you back for the celebration.
            </p>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-deep text-lg font-semibold text-cream shadow-xl shadow-green-dark/30 ring-1 ring-inset ring-gold/40 transition-all hover:bg-green-dark active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50"
          >
            Let&apos;s Get Started
            <ArrowRight className="size-5" />
          </button>

          <p className="mt-5 text-xs font-medium text-brown/70">Takes less than 2 minutes ✨</p>
        </div>
      </div>
    </div>
  )
}
