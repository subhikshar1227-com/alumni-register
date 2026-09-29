"use client"

import { IdCard } from "lucide-react"

export function FinalInfoCard() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold/60 bg-cream/60 p-5">
      <IdCard className="mt-0.5 size-4 shrink-0 text-green-deep" />
      <div>
        <h3 className="font-display text-lg font-bold text-green-deep">What&apos;s next?</h3>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-brown/80">
          Once your registration is reviewed and approved, your Alumni Membership Card and Event
          Entry Pass will be generated and sent to your registered email address.
        </p>
      </div>
    </div>
  )
}
