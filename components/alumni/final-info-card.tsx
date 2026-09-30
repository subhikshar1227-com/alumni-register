"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import type { FormData } from "./types"

export function FinalInfoCard({ data }: { data: FormData }) {
  const [photoPreview, setPhotoPreview] = useState<string>()

  useEffect(() => {
    if (!data.photo) {
      setPhotoPreview(undefined)
      return
    }

    const objectUrl = URL.createObjectURL(data.photo)
    setPhotoPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [data.photo])

  const details: { label: string; value: string }[] = [
    { label: "Full name", value: data.name },
    { label: "Batch / year", value: data.year },
    { label: "Branch", value: data.branch },
    ...(data.usn.trim() ? [{ label: "University seat number", value: data.usn }] : []),
    {
      label: "Attendance",
      value: data.attending === "yes" ? "Attending" : "Unable to attend",
    },
    ...(data.attending === "yes"
      ? [
          {
            label: "People attending",
            value: data.peopleCount === "Other" ? data.peopleOther : data.peopleCount,
          },
          {
            label: "Food preference",
            value: data.food === "veg" ? "Vegetarian" : "Non-vegetarian",
          },
        ]
      : []),
    { label: "Contact number", value: `+91 ${data.phone}` },
    { label: "Email address", value: data.email },
    { label: "Current workplace", value: data.company },
    ...(data.linkedinUrl.trim() ? [{ label: "LinkedIn profile", value: data.linkedinUrl }] : []),
    ...(data.position.trim() ? [{ label: "Current position", value: data.position }] : []),
    ...(data.experience.trim() ? [{ label: "Area of experience", value: data.experience }] : []),
    ...(data.awards.trim() ? [{ label: "Awards or achievements", value: data.awards }] : []),
  ]

  return (
    <section className="rounded-xl border border-gold/60 bg-cream/60 p-4">
      <h3 className="font-display text-lg font-bold text-green-deep">Review your registration</h3>
      <p className="mt-1 text-pretty text-sm leading-relaxed text-brown/80">
        Please check that all your details are correct before submitting.
      </p>
      <dl className="mt-3 divide-y divide-gold/35">
        <div className="grid grid-cols-[minmax(6rem,0.38fr)_minmax(0,1fr)] gap-3 py-3 first:pt-0">
          <dt className="text-sm font-semibold text-green-deep">Profile photo</dt>
          <dd className="flex min-w-0 items-center gap-3 text-sm text-brown/85">
            {photoPreview && (
              <Image
                src={photoPreview}
                alt="Uploaded profile photo"
                width={56}
                height={56}
                unoptimized
                className="size-14 shrink-0 rounded-lg border border-gold/50 object-cover"
              />
            )}
            <span className="break-all">{data.photo?.name ?? "No photo uploaded"}</span>
          </dd>
        </div>
        {details.map(({ label, value }) => (
          <div key={label} className="grid grid-cols-[minmax(6rem,0.38fr)_minmax(0,1fr)] gap-3 py-3">
            <dt className="text-sm font-semibold text-green-deep">{label}</dt>
            <dd className="min-w-0 break-words text-sm text-brown/85">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
