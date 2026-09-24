"use client"

import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type TextInputProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "email" | "tel" | "number"
  optional?: boolean
  error?: string
  inputMode?: "text" | "email" | "tel" | "numeric"
  prefix?: ReactNode
  multiline?: boolean
  maxLength?: number
  autoFocus?: boolean
  onEnter?: () => void
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional,
  error,
  inputMode,
  prefix,
  multiline,
  maxLength,
  autoFocus,
  onEnter,
}: TextInputProps) {
  const baseField = cn(
    "w-full rounded-2xl border-2 bg-ivory px-4 py-3.5 text-base text-brown shadow-sm outline-none transition-all",
    "placeholder:text-brown/40",
    "focus:border-green-deep focus:ring-4 focus:ring-gold/25",
    error ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-gold/50",
    prefix && "rounded-l-none border-l-0 pl-3",
  )

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-deep">
        {label}
        {optional && (
          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.7rem] font-medium text-maroon">
            Optional
          </span>
        )}
      </label>

      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className={cn(baseField, "resize-none leading-relaxed")}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : (
        <div className={cn("flex items-stretch", prefix && "rounded-2xl")}>
          {prefix && (
            <span className="flex items-center rounded-l-2xl border-2 border-r-0 border-gold/50 bg-green-deep px-3.5 text-base font-semibold text-cream">
              {prefix}
            </span>
          )}
          <input
            id={id}
            type={type}
            inputMode={inputMode}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229 &&
                onEnter
              ) {
                e.preventDefault()
                onEnter()
              }
            }}
            placeholder={placeholder}
            maxLength={maxLength}
            autoFocus={autoFocus}
            className={baseField}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
      )}

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
