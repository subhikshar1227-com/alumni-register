"use client"

import { IdCard } from "lucide-react"

export function FinalInfoCard() {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-gold/60 bg-cream/60 p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-green-deep ring-1 ring-gold/40">
        <IdCard className="size-5" />
      </span>
      <div>
        <h3 className="font-display text-base font-bold text-green-deep">What&apos;s next?</h3>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-brown/80">
          Once your registration is reviewed and approved, your Alumni Membership Card and Event
          Entry Pass will be generated and sent to your registered email address.
        </p>
      </div>
    </div>
  )
}
