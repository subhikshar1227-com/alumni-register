"use client"

import { useMemo, useState } from "react"
import {
  ATTENDANCE_OPTIONS,
  BATCH_YEARS,
  BRANCHES,
  COLLEGE_SHORT,
  FOOD_PREFERENCES,
  PEOPLE_OPTIONS,
} from "@/lib/config"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { BenefitsCard } from "./benefits-card"
import { ChoiceCard } from "./choice-card"
import { FinalInfoCard } from "./final-info-card"
import { FormStep } from "./form-step"
import { DiyaDecor, HangingLights, LogoEmblem } from "./festive-decor"
import { NavigationButtons } from "./navigation-buttons"
import { ProgressIndicator } from "./progress-indicator"
import { SelectInput } from "./select-input"
import { SuccessScreen } from "./success-screen"
import { TextInput } from "./text-input"
import { WelcomeScreen } from "./welcome-screen"
import { INITIAL_FORM_DATA, type Errors, type FormData } from "./types"

type Phase = "welcome" | "form" | "success"

type StepId =
  | "benefits"
  | "name"
  | "year"
  | "branch"
  | "usn"
  | "attendance"
  | "event"
  | "contact"
  | "career"
  | "review"

const SECTIONS = ["About You", "Event", "Contact", "Career", "Complete"] as const

const STEP_SECTION: Record<StepId, (typeof SECTIONS)[number]> = {
  benefits: "About You",
  name: "About You",
  year: "About You",
  branch: "About You",
  usn: "About You",
  attendance: "Event",
  event: "Event",
  contact: "Contact",
  career: "Career",
  review: "Complete",
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function isValidIndianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return /^[6-9]\d{9}$/.test(digits)
}

function isValidLinkedInUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return (
      url.protocol === "https:" &&
      (url.hostname === "linkedin.com" || url.hostname === "www.linkedin.com") &&
      url.pathname.length > 1
    )
  } catch {
    return false
  }
}

export function AlumniRegistration() {
  const [phase, setPhase] = useState<Phase>("welcome")
  const [data, setData] = useState<FormData>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<Errors>({})
  const [currentStep, setCurrentStep] = useState<StepId>("benefits")
  const [submitting, setSubmitting] = useState(false)

  // Active steps depend on the attendance answer.
  const steps = useMemo<StepId[]>(() => {
    const base: StepId[] = ["benefits", "name", "year", "branch", "usn", "attendance"]
    if (data.attending === "yes") base.push("event")
    base.push("contact", "career", "review")
    return base
  }, [data.attending])

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function validateStep(step: StepId): Errors {
    const e: Errors = {}
    switch (step) {
      case "name":
        if (!data.name.trim()) e.name = "Please enter your name to continue."
        break
      case "year":
        if (!data.year) e.year = "Please select your batch year."
        break
      case "branch":
        if (!data.branch) e.branch = "Please select your branch."
        break
      case "attendance":
        if (!data.attending) e.attending = "Please let us know if you can attend."
        break
      case "event":
        if (!data.peopleCount) e.peopleCount = "Please choose how many people are coming."
        if (data.peopleCount === "Other") {
          const n = Number(data.peopleOther)
          if (!data.peopleOther.trim() || Number.isNaN(n) || n < 1) {
            e.peopleOther = "Please enter a valid number of people."
          }
        }
        if (!data.food) e.food = "Please select a food preference."
        break
      case "contact":
        if (!data.phone.trim()) e.phone = "Please enter your contact number."
        else if (!isValidIndianPhone(data.phone))
          e.phone = "Enter a valid 10-digit Indian mobile number."
        if (!data.email.trim()) e.email = "Please enter your email address."
        else if (!isValidEmail(data.email)) e.email = "Please enter a valid email address."
        break
      case "career":
        if (!data.photo) e.photo = "Please upload a profile photo."
        if (!data.linkedinUrl.trim()) e.linkedinUrl = "Please enter your LinkedIn profile URL."
        else if (!isValidLinkedInUrl(data.linkedinUrl))
          e.linkedinUrl = "Enter a valid https://www.linkedin.com profile URL."
        if (!data.company.trim()) e.company = "Please let us know where you currently work."
        break
      default:
        break
    }
    return e
  }

  const goNext = () => {
    const stepErrors = validateStep(currentStep)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    const index = steps.indexOf(currentStep)
    if (index < steps.length - 1) {
      setCurrentStep(steps[index + 1])
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goBack = () => {
    const index = steps.indexOf(currentStep)
    if (index <= 0) {
      setPhase("welcome")
      return
    }
    setErrors({})
    setCurrentStep(steps[index - 1])
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // No backend yet — simulate a brief submit before showing the success screen.
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)
    setPhase("success")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleStart = () => {
    setPhase("form")
    setCurrentStep("benefits")
  }

  const handleRestart = () => {
    setData(INITIAL_FORM_DATA)
    setErrors({})
    setCurrentStep("benefits")
    setPhase("welcome")
  }

  if (phase === "welcome") return <WelcomeScreen onStart={handleStart} />
  if (phase === "success") return <SuccessScreen data={data} onRestart={handleRestart} />

  return (
    <div className="festive-bg min-h-dvh px-4 py-6 sm:py-9">
      <div className="animate-fade-up mx-auto w-full max-w-lg">
        <div className="festive-panel overflow-hidden rounded-2xl">
          {/* Festive header with progress */}
          <header className="border-b border-gold/50 bg-cream/70 px-5 pb-4 pt-4">
            <HangingLights className="mb-4" count={13} />
            <div className="mb-4 flex items-center justify-center gap-2.5">
              <LogoEmblem size={40} />
              <span className="font-display text-xl font-bold tracking-wide text-green-deep">
                {COLLEGE_SHORT} Silver Jubilee
              </span>
            </div>
            <div className="mb-3 flex items-center justify-center gap-3" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <DiyaDecor key={index} className="h-7 w-9" />
              ))}
            </div>
            <ProgressIndicator sections={[...SECTIONS]} currentSection={STEP_SECTION[currentStep]} />
          </header>

          <main className="festive-motif px-5 pb-8 pt-6 sm:px-7">
            {currentStep === "benefits" && (
              <div className="animate-step-in">
                <BenefitsCard />
              </div>
            )}

            {currentStep === "name" && (
              <FormStep title="What's your name?" subtitle="Let's start with the basics.">
                <TextInput
                  id="name"
                  label="Full name"
                  value={data.name}
                  onChange={(v) => update("name", v)}
                  placeholder="Enter your full name"
                  error={errors.name}
                  autoFocus
                  onEnter={goNext}
                />
              </FormStep>
            )}

            {currentStep === "year" && (
              <FormStep title={`When did you start your journey at ${COLLEGE_SHORT}?`} subtitle="Pick your joining-in batch.">
                <SelectInput
                  id="year"
                  label="Batch / Year"
                  value={data.year}
                  onChange={(v) => update("year", v)}
                  options={BATCH_YEARS}
                  placeholder="Select your year"
                  error={errors.year}
                  autoFocus
                />
              </FormStep>
            )}

            {currentStep === "branch" && (
              <FormStep title="Which branch did you belong to?" subtitle="Choose your department.">
                <SelectInput
                  id="branch"
                  label="Branch"
                  value={data.branch}
                  onChange={(v) => update("branch", v)}
                  options={BRANCHES}
                  placeholder="Select your branch"
                  error={errors.branch}
                  autoFocus
                />
              </FormStep>
            )}

            {currentStep === "usn" && (
              <FormStep
                title="Do you remember your USN?"
                subtitle="No worries if you don't — this one is optional."
              >
                <TextInput
                  id="usn"
                  label="University Seat Number"
                  value={data.usn}
                  onChange={(v) => update("usn", v)}
                  placeholder="e.g. 1SP01CS001"
                  optional
                  autoFocus
                  onEnter={goNext}
                />
              </FormStep>
            )}

            {currentStep === "attendance" && (
              <FormStep
                title="Are you attending the Silver Jubilee event?"
                subtitle="Your answer helps us plan the celebration."
              >
                <div className="space-y-3">
                  {ATTENDANCE_OPTIONS.map((option) => (
                    <ChoiceCard
                      key={option.value}
                      selected={data.attending === option.value}
                      onSelect={() => update("attending", option.value)}
                      title={option.title}
                      description={option.description}
                      emoji={option.emoji}
                    />
                  ))}
                </div>
                {errors.attending && (
                  <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">
                    {errors.attending}
                  </p>
                )}
              </FormStep>
            )}

            {currentStep === "event" && (
              <FormStep title="A few event details" subtitle="So we can host you comfortably.">
                <div>
                  <p className="mb-3 text-sm font-semibold text-green-deep">
                    How many people are you coming with?
                  </p>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                    {PEOPLE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          update("peopleCount", option)
                          if (option !== "Other") update("peopleOther", "")
                        }}
                        aria-pressed={data.peopleCount === option}
                        className={cn(
                          "flex h-12 items-center justify-center rounded-xl border-2 text-base font-semibold transition-all active:translate-y-px",
                          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40",
                          data.peopleCount === option
                            ? "border-gold bg-green-deep text-cream shadow-md shadow-green-dark/25"
                            : "border-gold/50 bg-ivory text-brown hover:border-gold hover:bg-gold/10",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {errors.peopleCount && (
                    <p className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">
                      {errors.peopleCount}
                    </p>
                  )}

                  {data.peopleCount === "Other" && (
                    <div className="animate-step-in mt-4">
                      <TextInput
                        id="peopleOther"
                        label="How many people are you bringing?"
                        value={data.peopleOther}
                        onChange={(v) => update("peopleOther", v.replace(/\D/g, ""))}
                        placeholder="Enter a number"
                        type="number"
                        inputMode="numeric"
                        error={errors.peopleOther}
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <p className="mb-3 text-sm font-semibold text-green-deep">What is your food preference?</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {FOOD_PREFERENCES.map((option) => (
                      <ChoiceCard
                        key={option.value}
                        selected={data.food === option.value}
                        onSelect={() => update("food", option.value)}
                        title={option.label}
                        description={option.hint}
                        emoji={option.emoji}
                      />
                    ))}
                  </div>
                  {errors.food && (
                    <p className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">
                      {errors.food}
                    </p>
                  )}
                </div>
              </FormStep>
            )}

            {currentStep === "contact" && (
              <FormStep title="How can we reach you?" subtitle="We'll use these to share your pass and updates.">
                <TextInput
                  id="phone"
                  label="Contact number"
                  value={data.phone}
                  onChange={(v) => update("phone", v.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  type="tel"
                  inputMode="tel"
                  prefix="+91"
                  error={errors.phone}
                  autoFocus
                />
                <TextInput
                  id="email"
                  label="Email address"
                  value={data.email}
                  onChange={(v) => update("email", v)}
                  placeholder="you@example.com"
                  type="email"
                  inputMode="email"
                  error={errors.email}
                  onEnter={goNext}
                />
                <p className="text-xs text-muted-foreground">
                  Your membership card and entry pass will be sent to this email.
                </p>
              </FormStep>
            )}

            {currentStep === "career" && (
              <FormStep
                title="Tell us about your journey"
                subtitle="Add a profile photo and LinkedIn URL. The other details help us introduce you to the alumni community."
              >
                <div className="w-full">
                  <label htmlFor="photo" className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-deep">
                    Profile photo
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[0.7rem] font-medium text-maroon">
                      Required
                    </span>
                  </label>
                  <label
                    htmlFor="photo"
                    className={cn(
                      "relative flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed bg-ivory px-4 py-3 text-sm text-brown transition-colors hover:border-green-deep focus-within:ring-4 focus-within:ring-gold/25",
                      errors.photo ? "border-destructive" : "border-gold/60",
                    )}
                  >
                    <Upload className="size-5 shrink-0 text-green-deep" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">
                      {data.photo ? data.photo.name : "Choose a clear photo (JPG, PNG or WEBP, up to 5 MB)"}
                    </span>
                    <input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-required="true"
                      aria-invalid={!!errors.photo}
                      aria-describedby={errors.photo ? "photo-error" : undefined}
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0] ?? null
                        if (file && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
                          update("photo", null)
                          setErrors((prev) => ({
                            ...prev,
                            photo: file.size > 5 * 1024 * 1024
                              ? "Photo must be 5 MB or smaller."
                              : "Choose an image file in JPG, PNG or WEBP format.",
                          }))
                          event.currentTarget.value = ""
                          return
                        }
                        update("photo", file)
                      }}
                    />
                  </label>
                  {errors.photo && (
                    <p id="photo-error" className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">
                      {errors.photo}
                    </p>
                  )}
                </div>
                <TextInput
                  id="linkedinUrl"
                  label="LinkedIn profile URL"
                  value={data.linkedinUrl}
                  onChange={(v) => update("linkedinUrl", v)}
                  placeholder="https://www.linkedin.com/in/your-name"
                  type="url"
                  inputMode="url"
                  error={errors.linkedinUrl}
                  autoFocus
                />
                <TextInput
                  id="company"
                  label="Where are you currently working?"
                  value={data.company}
                  onChange={(v) => update("company", v)}
                  placeholder="Company / Organisation"
                  error={errors.company}
                  autoFocus
                />
                <TextInput
                  id="position"
                  label="What is your current position?"
                  value={data.position}
                  onChange={(v) => update("position", v)}
                  placeholder="Your role / designation"
                  optional
                />
                <TextInput
                  id="experience"
                  label="What is your area of experience?"
                  value={data.experience}
                  onChange={(v) => update("experience", v)}
                  placeholder="e.g. Software, Finance, Healthcare, Education..."
                  optional
                />
                <TextInput
                  id="awards"
                  label="Any awards or achievements you'd like to share?"
                  value={data.awards}
                  onChange={(v) => update("awards", v)}
                  placeholder="Tell us about any awards, achievements or milestones..."
                  optional
                  multiline
                />
              </FormStep>
            )}

            {currentStep === "review" && (
              <FormStep
                title="Almost done!"
                subtitle="Here's what your alumni membership brings you."
              >
                <FinalInfoCard />
              </FormStep>
            )}

            <NavigationButtons
              onBack={goBack}
              onNext={currentStep === "review" ? handleSubmit : goNext}
              nextLabel={currentStep === "review" ? (submitting ? "Submitting…" : "Complete Registration") : "Continue"}
              isLast={currentStep === "review"}
              disabled={submitting}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
