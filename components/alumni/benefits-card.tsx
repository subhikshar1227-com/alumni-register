"use client"

import { ALUMNI_BENEFITS, COLLEGE_SHORT } from "@/lib/config"
import { Bell, Briefcase, CalendarDays, Heart, Users, type LucideIcon } from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  users: Users,
  heart: Heart,
  calendar: CalendarDays,
  briefcase: Briefcase,
  bell: Bell,
}

export function BenefitsCard() {
  return (
    <div className="rounded-3xl border-2 border-gold/60 bg-cream/70 p-5 shadow-sm">
      <h3 className="font-display text-lg font-bold text-green-deep">
        Why become an {COLLEGE_SHORT} Alumni?
      </h3>
      <p className="mt-1 text-sm text-brown/75">A lifelong connection with your college.</p>

      <ul className="mt-4 space-y-3">
        {ALUMNI_BENEFITS.map((benefit) => {
          const Icon = ICONS[benefit.icon] ?? Users
          return (
            <li key={benefit.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-deep text-cream ring-1 ring-gold/40">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-green-deep">{benefit.title}</span>
                <span className="block text-sm text-brown/75">{benefit.text}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
