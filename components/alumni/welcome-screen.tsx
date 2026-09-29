"use client"

import { ArrowRight } from "lucide-react"
import { HangingLights, LogoEmblem, OrnamentalDivider } from "./festive-decor"

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
                You&apos;re invited back to
              </p>
              <h1 className="mt-1 text-balance font-display text-2xl font-bold leading-tight text-green-deep sm:text-3xl">
                SVCE Silver Jubilee
              </h1>
            </div>
          </div>

          <p className="mt-4 text-pretty text-[0.95rem] leading-relaxed text-brown/85">
            Twenty-five years on, the college is putting together a reunion and wants to know
            who&apos;s coming. This form takes your batch details and, if you&apos;re joining us,
            a few notes for the day.
          </p>

          <OrnamentalDivider className="my-6" />

          <div className="border-l-2 border-gold pl-4">
            <h2 className="font-display text-xl font-bold text-green-deep">
              Alumni Registration
            </h2>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-brown/75">
              An unofficial, alumni-run effort — not a college department. Your details go
              towards planning the celebration and your entry pass.
            </p>
          </div>

          <div className="mt-4 border-l-2 border-gold pl-4">
            <h2 className="font-display text-xl font-bold text-green-deep">Alumni Membership</h2>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-brown/75">
              Can&apos;t join us for the Silver Jubilee celebration? That&apos;s completely okay.
              We understand that not everyone may be able to make it this time. You can still
              share your details with us so we can stay connected and keep you in the loop for
              future alumni gatherings and updates.
            </p>
          </div>

          <p className="mt-4 text-pretty text-sm leading-relaxed text-brown/75">
            Every alumnus who registers receives a personalised Membership Card and Event Entry
            Pass, sent to their registered email once verified by the organising batch.
          </p>

          <button
            type="button"
            onClick={onStart}
            className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-xl border-2 border-gold-bright bg-green-deep text-base font-semibold text-cream shadow-md transition-all hover:bg-green-dark active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/50"
          >
            Start registration
            <ArrowRight className="size-4" />
          </button>

          <p className="mt-4 text-center text-xs text-brown/60">About two minutes, mostly dropdowns.</p>
        </div>
      </div>
    </div>
  )
}
