"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, Users, XCircle } from "lucide-react"

type CheckinInfo = {
  name: string
  eligible: boolean
  notApproved: boolean
  notAttending: boolean
  peopleCount: number
  checkedIn: boolean
  checkedInAt: string | null
}

export default function CheckinPage() {
  const params = useParams<{ alumniId: string }>()
  const alumniId = decodeURIComponent(params.alumniId)
  const [info, setInfo] = useState<CheckinInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/checkin/${encodeURIComponent(alumniId)}`)
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok) throw new Error(json?.error || "Could not look up this Alumni ID.")
        if (!cancelled) setInfo(json)
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Could not look up this Alumni ID.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [alumniId])

  async function markArrived() {
    setMarking(true)
    setError("")
    try {
      const response = await fetch(`/api/checkin/${encodeURIComponent(alumniId)}`, { method: "POST" })
      const json = await response.json()
      if (!response.ok) throw new Error(json?.error || "Could not confirm arrival.")
      setInfo(json)
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Could not confirm arrival.")
    } finally {
      setMarking(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#101a2d] px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-[#2a3a54] bg-[#172237] p-6 text-center text-white shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5fb8e0]">SVCE Silver Jubilee — Entry Check-in</p>

        {loading && <p className="mt-8 text-sm text-[#9aa7ba]">Looking up Alumni ID {alumniId}...</p>}

        {!loading && error && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <XCircle className="size-10 text-[#ff9b8f]" />
            <p className="text-sm font-semibold text-[#ffc0b5]">{error}</p>
          </div>
        )}

        {!loading && !error && info && (
          <>
            <h1 className="mt-4 text-2xl font-bold">{info.name}</h1>
            <p className="mt-1 text-xs text-[#9aa7ba]">{alumniId}</p>

            {info.notApproved ? (
              <p className="mt-6 rounded-lg border border-[#44536a] bg-[#1d293d] px-4 py-3 text-sm font-semibold text-[#ffc541]">
                This registration isn&apos;t approved yet.
              </p>
            ) : info.notAttending ? (
              <p className="mt-6 rounded-lg border border-[#44536a] bg-[#1d293d] px-4 py-3 text-sm font-semibold text-[#e0e6ef]">
                Marked as not attending — no check-in needed.
              </p>
            ) : (
              <>
                <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#2a3a54] bg-[#101a2d] px-4 py-3">
                  <Users className="size-5 text-[#5fb8e0]" />
                  <span className="text-lg font-bold">{info.peopleCount}</span>
                  <span className="text-sm text-[#9aa7ba]">{info.peopleCount === 1 ? "person expected" : "people expected"}</span>
                </div>

                {info.checkedIn ? (
                  <div className="mt-5 flex flex-col items-center gap-2 rounded-lg border border-[#28624f] bg-[#183b35] px-4 py-4">
                    <CheckCircle2 className="size-9 text-[#45d2aa]" />
                    <p className="text-sm font-bold text-[#9be4c8]">Checked in</p>
                    {info.checkedInAt && (
                      <p className="text-xs text-[#9be4c8]/80">
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(info.checkedInAt))}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={marking}
                    onClick={markArrived}
                    className="mt-5 h-12 w-full rounded-lg bg-[#16805f] text-base font-bold text-white hover:bg-[#136e51] disabled:opacity-50"
                  >
                    {marking ? "Confirming..." : "Mark Arrived"}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
