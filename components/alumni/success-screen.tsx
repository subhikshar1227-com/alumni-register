"use client"

import type { FormData } from "./types"
import { Check, Mail, PartyPopper, ShieldCheck } from "lucide-react"
import { HangingLights, MandalaEmblem, OrnamentalDivider } from "./festive-decor"

type SuccessScreenProps = {
  data: FormData
  onRestart: () => void
}

export function SuccessScreen({ data, onRestart }: SuccessScreenProps) {
  return (
    <div className="festive-bg flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="animate-fade-up w-full max-w-md">
        <div className="festive-panel festive-motif overflow-hidden rounded-[1.75rem] px-6 pb-8 pt-5 text-center sm:px-8">
          <HangingLights className="mb-7" />

          {/* Success emblem */}
          <div className="relative mx-auto mb-5 flex size-24 items-center justify-center">
            <span
              className="absolute inset-0 animate-ping rounded-full bg-gold/25"
              style={{ animationDuration: "2s" }}
            />
            <span className="relative flex size-24 items-center justify-center rounded-full border-2 border-gold bg-green-deep shadow-xl shadow-green-dark/40 ring-4 ring-maroon/25">
              <Check className="size-12 text-cream" strokeWidth={3} />
            </span>
          </div>

          <h1 className="flex items-center justify-center gap-2 font-display text-3xl font-bold text-green-deep">
            You&apos;re all set! <PartyPopper className="size-7 text-gold" />
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-brown/85">
            Thank you for registering, {data.name?.split(" ")[0] || "friend"}. Your details have
            been received successfully.
          </p>

          <OrnamentalDivider className="my-6" />

          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3 rounded-2xl border-2 border-gold/50 bg-cream/70 p-4 shadow-sm">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-deep" />
              <p className="text-sm leading-relaxed text-brown/85">
                Your registration will be processed after{" "}
                <span className="font-semibold text-maroon">verification</span>.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border-2 border-gold/50 bg-cream/70 p-4 shadow-sm">
              <Mail className="mt-0.5 size-5 shrink-0 text-green-deep" />
              <p className="text-sm leading-relaxed text-brown/85">
                Your Alumni Membership Card and Event Entry Pass will be sent to{" "}
                <span className="font-semibold text-maroon">
                  {data.email || "your registered email"}
                </span>
                .
              </p>
            </div>
          </div>

          {data.attending === "yes" && (
          <div
            className="mt-4 rounded-2xl border p-4 text-center text-sm font-semibold shadow-[0_2px_18px_-6px_rgba(212,160,23,0.55)]"
            style={{ backgroundColor: "#FFF3D6", borderColor: "#D4A017", color: "#7A4A18" }}
          >
            We can&apos;t wait to celebrate with you at the Silver Jubilee! 🎉
          </div>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="mt-7 text-sm font-semibold text-green-deep underline-offset-4 hover:underline"
          >
            Register another alumnus
          </button>
        </div>
      </div>
    </div>
  )
}
