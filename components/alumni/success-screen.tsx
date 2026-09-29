"use client"

import type { FormData } from "./types"
import { Check, Mail, ShieldCheck } from "lucide-react"
import { HangingLights, OrnamentalDivider } from "./festive-decor"

type SuccessScreenProps = {
  data: FormData
  onRestart: () => void
}

export function SuccessScreen({ data, onRestart }: SuccessScreenProps) {
  return (
    <div className="festive-bg flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="animate-fade-up w-full max-w-md">
        <div className="festive-panel festive-motif overflow-hidden rounded-2xl px-6 pb-8 pt-5 text-center sm:px-8">
          <HangingLights className="mb-7" />

          {/* Success emblem */}
          <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full border-2 border-gold bg-green-deep shadow-md">
            <Check className="size-10 text-cream" strokeWidth={3} />
          </div>

          <h1 className="font-display text-2xl font-bold text-green-deep sm:text-3xl">
            Registered, {data.name?.split(" ")[0] || "friend"}
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-brown/85">
            Thanks for filling this in — we&apos;ve got your details on record for the Silver
            Jubilee.
          </p>

          <OrnamentalDivider className="my-6" />

          <div className="space-y-3 border-l-2 border-gold pl-4 text-left">
            <p className="flex gap-2.5 text-sm leading-relaxed text-brown/85">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-deep" />
              <span>
                Processed after <span className="font-semibold text-maroon">verification</span>{" "}
                by the organising batch.
              </span>
            </p>
            <p className="flex gap-2.5 text-sm leading-relaxed text-brown/85">
              <Mail className="mt-0.5 size-4 shrink-0 text-green-deep" />
              <span>
                Membership card and entry pass go to{" "}
                <span className="font-semibold text-maroon">
                  {data.email || "your registered email"}
                </span>
                .
              </span>
            </p>
          </div>

          {data.attending === "yes" && (
            <div className="mt-4 rounded-lg border border-gold bg-gold/10 p-3 text-center text-sm font-semibold text-maroon">
              See you at the Silver Jubilee.
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
