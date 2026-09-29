"use client"

import type { ReactNode } from "react"
import { OrnamentalDivider } from "./festive-decor"

type FormStepProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function FormStep({ title, subtitle, children }: FormStepProps) {
  return (
    <div className="animate-step-in">
      <h2 className="text-balance font-display text-2xl font-bold leading-tight text-green-deep sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-pretty text-sm leading-relaxed text-brown/80">{subtitle}</p>
      )}
      <OrnamentalDivider className="mt-4 justify-start [&>span:first-child]:hidden" />
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  )
}
