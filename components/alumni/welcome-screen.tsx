"use client"

import { ArrowRight } from "lucide-react"
import { DiyaDecor, HangingLights, LogoEmblem, OrnamentalDivider } from "./festive-decor"

type WelcomeScreenProps = {
  onStart: () => void
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="festive-bg flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="animate-fade-up w-full max-w-md">
        <div className="festive-panel festive-motif relative overflow-hidden rounded-2xl px-6 pb-8 pt-5 sm:px-8">
          {/* Ribbon tag, pinned to the corner like a printed invite sticker */}
          <div className="absolute -right-9 top-5 z-10 w-36 rotate-45 bg-maroon py-1 text-center text-[0.65rem] font-bold uppercase tracking-widest text-cream shadow-sm">
            25th Year
          </div>

          <HangingLights className="mb-7" />

          <div className="flex items-center gap-5">
            <LogoEmblem size={52} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-maroon">
                25 Years of SVCE.
              </p>
              <h1 className="mt-1 flex items-center gap-2 text-balance font-display text-2xl font-bold leading-tight text-green-deep sm:text-3xl">
                <span className="min-w-0">SVCE Silver Jubilee</span>
                <DiyaDecor className="h-7 w-9 shrink-0" />
              </h1>
            </div>
          </div>

          <p className="mt-4 text-pretty text-[0.95rem] leading-relaxed text-brown/85">
            A Lifetime of Memories. As SVCE celebrates its Silver Jubilee, we invite our alumni
            to come back, reconnect and be part of this special milestone.
          </p>

          <OrnamentalDivider className="my-6" />

          <div className="border-l-2 border-gold pl-4">
            <h2 className="font-display text-xl font-bold text-green-deep">
              ALUMNI REGISTRATION
            </h2>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-brown/75">
              Register to attend the Silver Jubilee celebration and receive your Event Entry Pass.
            </p>
          </div>

          <div className="mt-4 border-l-2 border-gold pl-4">
            <h2 className="font-display text-xl font-bold text-green-deep">ALUMNI MEMBERSHIP</h2>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-brown/75">
              Unable to attend? Stay connected with the SVCE Alumni Community and receive updates
              about future gatherings.
            </p>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl border-2 border-gold-bright bg-green-deep text-base font-semibold text-cream shadow-md transition-all hover:bg-green-dark active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50"
          >
            Start registration
            <ArrowRight className="size-4" />
          </button>

        </div>
      </div>
    </div>
  )
}
