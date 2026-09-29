"use client"

import { ALUMNI_BENEFITS, COLLEGE_SHORT } from "@/lib/config"
import { cn } from "@/lib/utils"
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
    <div className="rounded-xl border-2 border-gold/60 bg-cream/70 p-5">
      <h3 className="font-display text-xl font-bold text-green-deep">
        Why become an {COLLEGE_SHORT} Alumni?
      </h3>
      <p className="mt-1 text-sm text-brown/75">A lifelong connection with your college.</p>

      <ul className="mt-4 space-y-3 divide-y divide-gold/25">
        {ALUMNI_BENEFITS.map((benefit, i) => {
          const Icon = ICONS[benefit.icon] ?? Users
          return (
            <li key={benefit.title} className={cn("flex items-start gap-3", i > 0 && "pt-3")}>
              <Icon className="mt-0.5 size-4 shrink-0 text-green-deep" />
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
