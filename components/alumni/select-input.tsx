"use client"

import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

type SelectInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  error?: string
  autoFocus?: boolean
}

export function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  autoFocus,
}: SelectInputProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-green-deep">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full appearance-none rounded-2xl border-2 bg-ivory px-4 py-3.5 pr-11 text-base shadow-sm outline-none transition-all",
            "focus:border-green-deep focus:ring-4 focus:ring-gold/25",
            value ? "text-brown" : "text-brown/45",
            error ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-gold/50",
          )}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="text-brown">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-green-deep"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
