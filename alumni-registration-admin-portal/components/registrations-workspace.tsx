'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  Download,
  Eye,
  IdCard,
  Mail,
  MailCheck,
  Moon,
  Send,
  Sun,
  TicketCheck,
  X,
} from 'lucide-react'
import {
  registrationService,
  type AlumniRegistration,
  type DocumentStatus,
  type EmailLogEntry,
  type RegistrationStatus,
} from '@/lib/registration-service'

const PAGE_SIZE = 25

function statusClasses(status: RegistrationStatus, theme: 'dark' | 'light') {
  const map = {
    PENDING: theme === 'dark' ? 'text-[#ffc541]' : 'text-[#ae7800]',
    APPROVED: theme === 'dark' ? 'text-[#45d2aa]' : 'text-[#16805f]',
    REJECTED: theme === 'dark' ? 'text-[#ff9b8f]' : 'text-[#9a3f31]',
  }
  return map[status]
}

// Ticks represent EMAIL SEND status only (never "generated but not sent" —
// generation is an internal backend step, not something the admin tracks).
// membershipStatus/entryPassStatus only ever reach SENT after a real
// successful send (see send-membership/send-entry-pass routes), so this is
// always backed by actual delivery, never just a button click.
function DocSentIcon({ status, isDark }: { status: DocumentStatus; isDark: boolean }) {
  if (status === 'SENT') {
    return <Check className={`size-4 ${isDark ? 'text-[#45d2aa]' : 'text-[#16805f]'}`} aria-hidden="true" />
  }
  if (status === 'NOT_APPLICABLE') {
    return <span className={`text-[11px] font-semibold ${isDark ? 'text-[#5a6880]' : 'text-[#a5adb7]'}`}>N/A</span>
  }
  return <span className={isDark ? 'text-[#5a6880]' : 'text-[#a5adb7]'}>—</span>
}

// Latest email attempt for a given type, from the already-loaded email
// history (API already orders these newest-first) — used to tell a real
// send failure apart from "never attempted".
function latestEmailStatus(logs: EmailLogEntry[], type: EmailLogEntry['emailType']) {
  return logs.find((log) => log.emailType === type)?.status ?? null
}

// "✓ Sent / Failed / — Not Sent" badge used in the detail modal — the three
// states Part 18 asks the UI to distinguish.
function SendStatusBadge({ sent, failed, isDark }: { sent: boolean; failed: boolean; isDark: boolean }) {
  if (sent) {
    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? 'bg-[#16805f]/20 text-[#45d2aa]' : 'bg-[#16805f]/10 text-[#16805f]'}`}>✓ Sent</span>
  }
  if (failed) {
    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? 'bg-[#80433d]/30 text-[#ff9b8f]' : 'bg-[#9a3f31]/10 text-[#9a3f31]'}`}>Failed</span>
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? 'bg-[#1d293d] text-[#5a6880]' : 'bg-[#eef2f6] text-[#a5adb7]'}`}>— Not Sent</span>
}

// Row status color, derived purely from database state (never from a button
// click): green once fully complete, red once rejected, orange otherwise
// (pending, or approved with an incomplete document/email workflow).
function rowTone(registration: AlumniRegistration): 'green' | 'orange' | 'red' {
  if (registration.status === 'REJECTED') return 'red'
  if (
    registration.status === 'APPROVED' &&
    registration.membershipStatus === 'SENT' &&
    (registration.entryPassStatus === 'SENT' || registration.entryPassStatus === 'NOT_APPLICABLE')
  ) {
    return 'green'
  }
  return 'orange'
}

function rowToneClasses(tone: 'green' | 'orange' | 'red', isDark: boolean) {
  const map = {
    green: isDark ? 'border-l-4 border-l-[#16805f] bg-[#16805f]/[0.07]' : 'border-l-4 border-l-[#16805f] bg-[#16805f]/[0.045]',
    orange: isDark ? 'border-l-4 border-l-[#c98a1f] bg-[#c98a1f]/[0.07]' : 'border-l-4 border-l-[#c98a1f] bg-[#c98a1f]/[0.045]',
    red: isDark ? 'border-l-4 border-l-[#9a3f31] bg-[#9a3f31]/[0.07]' : 'border-l-4 border-l-[#9a3f31] bg-[#9a3f31]/[0.045]',
  }
  return map[tone]
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function RegistrationsWorkspace() {
  const [registrations, setRegistrations] = useState<AlumniRegistration[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<AlumniRegistration | null>(null)
  const [emailHistory, setEmailHistory] = useState<EmailLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isDark = theme === 'dark'
  const dialogSurface = isDark ? 'border-[#44536a] bg-[#172237] text-[#e4eaf3]' : 'border-[#dce2e8] bg-white text-[#18202b]'

  async function loadRegistrations() {
    setLoading(true)
    setError('')
    try {
      const result = await registrationService.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: search.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setRegistrations(result.items)
      setTotal(result.total)
    } catch {
      setError('Could not load alumni registrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('svce-dashboard-theme-v1')
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
  }, [])

  useEffect(() => {
    loadRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  function toggleTheme() {
    const nextTheme = isDark ? 'light' : 'dark'
    setTheme(nextTheme)
    try {
      window.localStorage.setItem('svce-dashboard-theme-v1', nextTheme)
    } catch {
      setNotice('Theme changed for this session; browser storage is unavailable.')
    }
  }

  function updateInPlace(updated: AlumniRegistration) {
    setRegistrations((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    setViewing((current) => (current?.id === updated.id ? updated : current))
  }

  async function openDetail(registration: AlumniRegistration) {
    setViewing(registration)
    setEmailHistory([])
    setConfirmingReject(false)
    setRejectionReason('')
    setNotice('')
    setError('')
    try {
      setEmailHistory(await registrationService.emailHistory(registration.id))
    } catch {
      // Email history is a nice-to-have; ignore failures silently.
    }
  }

  async function runAction(key: string, action: () => Promise<AlumniRegistration>, successMessage: (result: AlumniRegistration) => string) {
    setBusy(key)
    setError('')
    try {
      const updated = await action()
      updateInPlace(updated)
      setNotice(successMessage(updated))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'This action could not be completed.')
    } finally {
      setBusy('')
    }
  }

  function approve(registration: AlumniRegistration) {
    runAction('approve', () => registrationService.approve(registration.id), (r) => `${r.name} has been approved.`)
  }

  function reject(registration: AlumniRegistration) {
    runAction(
      'reject',
      () => registrationService.reject(registration.id, rejectionReason.trim() || undefined),
      (r) => `${r.name}'s registration has been rejected.`,
    )
    setConfirmingReject(false)
    setRejectionReason('')
  }

  // Generation is an internal backend step — these Send actions handle it
  // automatically when needed (see send-membership/send-entry-pass routes),
  // so there is no separate Generate step or button in this UI.
  function sendMembership(registration: AlumniRegistration) {
    runAction('send-membership', () => registrationService.sendMembership(registration.id), (r) => `Membership card emailed to ${r.email}.`)
  }
  function sendEntryPass(registration: AlumniRegistration) {
    runAction('send-entry-pass', () => registrationService.sendEntryPass(registration.id), (r) => `Entry pass emailed to ${r.email}.`)
  }

  // Reuses the exact same idempotent send endpoints as the individual
  // buttons — no email or document-generation logic is duplicated. The
  // entry pass half is skipped when NOT_APPLICABLE (alumnus not attending).
  async function sendBoth(registration: AlumniRegistration) {
    setBusy('send-both')
    setError('')
    try {
      let updated = await registrationService.sendMembership(registration.id)
      updateInPlace(updated)
      if (updated.entryPassStatus !== 'NOT_APPLICABLE') {
        updated = await registrationService.sendEntryPass(registration.id)
        updateInPlace(updated)
      }
      setNotice(`${updated.name}'s documents have been emailed.`)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'This action could not be completed.')
    } finally {
      setBusy('')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <section className="w-full min-w-0" aria-labelledby="roster-title">
      <div className={`rounded-[18px] px-5 py-6 shadow-[0_18px_44px_rgba(12,22,40,0.16)] sm:px-7 sm:py-7 ${isDark ? 'bg-[#101a2d] text-white' : 'border border-[#dfe4e9] bg-white text-[#18202b]'}`}>
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="roster-title" className="text-base font-bold text-[#087fae]">SVCE Alumni Registration</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold ${isDark ? 'border-[#44536a] text-[#e0e6ef] hover:bg-[#2c3b50]' : 'border-[#d9e0e5] text-[#334155] hover:bg-[#f1f4f6]'}`}>{isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}{isDark ? 'Light mode' : 'Dark mode'}</button>
            <span className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${isDark ? 'bg-[#1d293d] text-[#a6b2c4]' : 'bg-[#eef2f6] text-[#64748b]'}`}>Role: Administrator</span>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { setStatusFilter(option); setPage(1) }}
              aria-pressed={statusFilter === option}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusFilter === option ? 'border-[#0788c5] bg-[#0788c5] text-white' : isDark ? 'border-[#44536a] text-[#e0e6ef] hover:bg-[#2c3b50]' : 'border-[#d9e0e5] text-[#334155] hover:bg-[#f1f4f6]'}`}
            >
              {option === 'ALL' ? 'All' : option[0] + option.slice(1).toLowerCase()}
            </button>
          ))}
          <form
            onSubmit={(event) => { event.preventDefault(); setPage(1); loadRegistrations() }}
            className="ml-auto flex items-center gap-2"
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, USN, Alumni ID..."
              className={`h-9 w-56 max-w-full rounded-md border px-3 text-xs outline-none ${isDark ? 'border-[#44536a] bg-[#101a2d] text-[#e4eaf3] placeholder:text-[#7f8ea3]' : 'border-[#dfe4e9] bg-white text-[#18202b] placeholder:text-[#a5adb7]'}`}
            />
            <button type="submit" className="h-9 rounded-md border border-[#0788c5] px-3 text-xs font-semibold text-[#0788c5] hover:bg-[#0788c5]/10">Search</button>
          </form>
        </div>

        {notice && <p role="status" className={`mb-4 rounded-md border px-3 py-2 text-sm ${isDark ? 'border-[#28624f] bg-[#183b35] text-[#9be4c8]' : 'border-[#cfe5d9] bg-[#f1faf4] text-[#246747]'}`}>{notice}</p>}
        {error && <p role="alert" className={`mb-4 rounded-md border px-3 py-2 text-sm ${isDark ? 'border-[#80433d] bg-[#402926] text-[#ffc0b5]' : 'border-[#f0d3cf] bg-[#fff7f5] text-[#9a3f31]'}`}>{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-left">
            <thead>
              <tr className={`text-sm font-semibold ${isDark ? 'text-[#9aa7ba]' : 'text-[#64748b]'}`}>
                <th scope="col" className="w-[7%] px-2 py-2">Photo</th>
                <th scope="col" className="w-[13%] px-2 py-2">Alumni Name</th>
                <th scope="col" className="w-[10%] px-2 py-2">Alumni ID</th>
                <th scope="col" className="w-[9%] px-2 py-2">USN</th>
                <th scope="col" className="w-[6%] px-2 py-2">Batch</th>
                <th scope="col" className="w-[11%] px-2 py-2">Branch</th>
                <th scope="col" className="w-[8%] px-2 py-2">Attendance</th>
                <th scope="col" className="w-[8%] px-2 py-2">Registration</th>
                <th scope="col" className="w-[8%] px-2 py-2">Membership</th>
                <th scope="col" className="w-[8%] px-2 py-2">Entry Pass</th>
                <th scope="col" className="w-[12%] px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="px-2 py-8 text-sm text-[#a6b2c4]">Loading alumni registrations...</td></tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan={11} className="px-2 py-8 text-sm text-[#a6b2c4]">No alumni registrations yet.</td></tr>
              ) : registrations.map((registration) => (
                <tr key={registration.id} className={`border-t text-sm ${isDark ? 'border-white/0 hover:bg-white/[0.04]' : 'border-[#eef0f3] hover:bg-[#f7f9fb]'} ${rowToneClasses(rowTone(registration), isDark)}`}>
                  <td className="px-2 py-3">
                    {registration.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={registration.photoUrl} alt="" className="size-9 rounded-full object-cover" />
                    ) : (
                      <span className={`flex size-9 items-center justify-center rounded-full text-xs font-bold ${isDark ? 'bg-[#1d293d] text-[#a6b2c4]' : 'bg-[#eef2f6] text-[#64748b]'}`}>
                        {registration.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <button type="button" onClick={() => openDetail(registration)} className={`block max-w-full truncate text-left font-semibold outline-none hover:underline ${isDark ? 'text-white' : 'text-[#18202b]'}`}>{registration.name}</button>
                  </td>
                  <td className={`px-2 py-3 truncate ${isDark ? 'text-[#e0e6ef]' : 'text-[#334155]'}`}>{registration.alumniId ?? 'Pending approval'}</td>
                  <td className={`px-2 py-3 truncate ${isDark ? 'text-[#e0e6ef]' : 'text-[#334155]'}`}>{registration.usn || '—'}</td>
                  <td className={`px-2 py-3 ${isDark ? 'text-[#e0e6ef]' : 'text-[#334155]'}`}>{registration.batchYear}</td>
                  <td className={`px-2 py-3 truncate ${isDark ? 'text-[#e0e6ef]' : 'text-[#334155]'}`}>{registration.branch}</td>
                  <td className={`px-2 py-3 ${isDark ? 'text-[#e0e6ef]' : 'text-[#334155]'}`}>{registration.attending ? 'Attending' : 'Not attending'}</td>
                  <td className={`px-2 py-3 font-bold ${statusClasses(registration.status, theme)}`}>{registration.status[0] + registration.status.slice(1).toLowerCase()}</td>
                  <td className="px-2 py-3">
                    {registration.status === 'APPROVED' ? (
                      <span title={`Membership card: ${registration.membershipStatus === 'SENT' ? 'sent' : 'not sent'}`}>
                        <DocSentIcon status={registration.membershipStatus} isDark={isDark} />
                      </span>
                    ) : (
                      <span className={isDark ? 'text-[#5a6880]' : 'text-[#a5adb7]'}>—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    {registration.status === 'APPROVED' ? (
                      <span title={`Entry pass: ${registration.entryPassStatus === 'NOT_APPLICABLE' ? 'not applicable' : registration.entryPassStatus === 'SENT' ? 'sent' : 'not sent'}`}>
                        <DocSentIcon status={registration.entryPassStatus} isDark={isDark} />
                      </span>
                    ) : (
                      <span className={isDark ? 'text-[#5a6880]' : 'text-[#a5adb7]'}>—</span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => openDetail(registration)} title="View full registration" className={`flex size-8 items-center justify-center rounded-md ${isDark ? 'text-[#e0e6ef] hover:bg-[#2c3b50]' : 'text-[#334155] hover:bg-[#eef2f6]'}`}><Eye className="size-4" /></button>
                      {registration.status === 'PENDING' && (
                        <>
                          <button type="button" onClick={() => approve(registration)} disabled={busy === 'approve'} title="Approve" className="flex size-8 items-center justify-center rounded-md text-[#16805f] hover:bg-[#16805f]/10 disabled:opacity-50"><Check className="size-4" /></button>
                          <button type="button" onClick={() => openDetail(registration).then(() => setConfirmingReject(true))} title="Reject" className="flex size-8 items-center justify-center rounded-md text-[#9a3f31] hover:bg-[#9a3f31]/10"><X className="size-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`mt-4 flex items-center justify-between text-xs ${isDark ? 'text-[#96a3b6]' : 'text-[#64748b]'}`}>
          <span>{total} alumni registration{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded border border-[#dfe4e9] px-2 py-1 disabled:opacity-40">Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded border border-[#dfe4e9] px-2 py-1 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1424]/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="alumni-detail-title" className={`w-full max-w-2xl overflow-y-auto rounded-xl border p-5 shadow-xl sm:p-6 ${dialogSurface}`} style={{ maxHeight: '90vh' }}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {viewing.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewing.photoUrl} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <span className={`flex size-14 items-center justify-center rounded-full text-base font-bold ${isDark ? 'bg-[#1d293d] text-[#a6b2c4]' : 'bg-[#eef2f6] text-[#64748b]'}`}>
                    {viewing.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#087fae]">{viewing.alumniId ?? 'Pending approval'}</p>
                  <h3 id="alumni-detail-title" className="mt-0.5 text-xl font-bold">{viewing.name}</h3>
                  <p className={`mt-0.5 text-xs font-bold ${statusClasses(viewing.status, theme)}`}>{viewing.status}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewing(null)} aria-label="Close details" className={`flex size-9 shrink-0 items-center justify-center rounded-md ${isDark ? 'text-[#a6b2c4] hover:bg-[#26354a]' : 'text-[#697583] hover:bg-[#f1f4f6]'}`}><X className="size-4" /></button>
            </div>

            <DetailSection title="Personal details" isDark={isDark}>
              <Detail label="Batch / Year" value={String(viewing.batchYear)} isDark={isDark} />
              <Detail label="Branch" value={viewing.branch} isDark={isDark} />
              <Detail label="USN" value={viewing.usn || '—'} isDark={isDark} />
            </DetailSection>

            <DetailSection title="Event details" isDark={isDark}>
              <Detail label="Attending" value={viewing.attending ? 'Yes' : 'No'} isDark={isDark} />
              {viewing.attending && (
                <>
                  <Detail label="Accompanying people" value={String(viewing.peopleCount ?? '—')} isDark={isDark} />
                  <Detail label="Food preference" value={viewing.food === 'NON_VEG' ? 'Non-vegetarian' : viewing.food === 'VEG' ? 'Vegetarian' : '—'} isDark={isDark} />
                  <Detail label="Checked in at event" value={viewing.checkedIn ? `Yes — ${formatDate(viewing.checkedInAt)}` : 'Not yet'} isDark={isDark} />
                </>
              )}
            </DetailSection>

            <DetailSection title="Contact details" isDark={isDark}>
              <Detail label="Contact number" value={`+91 ${viewing.phone}`} isDark={isDark} />
              <Detail label="Email" value={viewing.email} isDark={isDark} />
            </DetailSection>

            <DetailSection title="Professional details" isDark={isDark}>
              <Detail label="Company" value={viewing.company} isDark={isDark} />
              <Detail label="Position" value={viewing.position || '—'} isDark={isDark} />
              <Detail label="Area of experience" value={viewing.experience || '—'} isDark={isDark} />
              <Detail label="Awards / achievements" value={viewing.awards || '—'} isDark={isDark} />
              <Detail label="LinkedIn" value={viewing.linkedinUrl || '—'} isDark={isDark} />
            </DetailSection>

            <DetailSection title="System information" isDark={isDark}>
              <Detail label="Registered on" value={formatDate(viewing.createdAt)} isDark={isDark} />
              <Detail label="Approved on" value={formatDate(viewing.approvedAt)} isDark={isDark} />
              <Detail label="Rejected on" value={formatDate(viewing.rejectedAt)} isDark={isDark} />
              {viewing.rejectionReason && <Detail label="Rejection reason" value={viewing.rejectionReason} isDark={isDark} />}
            </DetailSection>

            {viewing.status === 'PENDING' && (
              <div className={`mt-5 rounded-lg border p-4 ${isDark ? 'border-[#334258]' : 'border-[#e9edf0]'}`}>
                <p className="mb-3 text-sm font-semibold">Verification decision</p>
                {!confirmingReject ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy === 'approve'} onClick={() => approve(viewing)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#16805f] px-4 text-sm font-semibold text-white hover:bg-[#136e51] disabled:opacity-50"><Check className="size-4" />{busy === 'approve' ? 'Approving...' : 'Approve'}</button>
                    <button type="button" onClick={() => setConfirmingReject(true)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#9a3f31] px-4 text-sm font-semibold text-[#9a3f31] hover:bg-[#9a3f31]/10"><X className="size-4" />Reject</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold">
                      Rejection reason (optional)
                      <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={2} className={`mt-1.5 w-full rounded-md border px-3 py-2 text-sm outline-none ${isDark ? 'border-[#4b5a70] bg-[#101a2d] text-[#e4eaf3]' : 'border-[#dfe4e9] bg-white text-[#18202b]'}`} />
                    </label>
                    <div className="flex gap-2">
                      <button type="button" disabled={busy === 'reject'} onClick={() => reject(viewing)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#9a3f31] px-4 text-sm font-semibold text-white hover:bg-[#7f3327] disabled:opacity-50"><X className="size-4" />{busy === 'reject' ? 'Rejecting...' : 'Confirm rejection'}</button>
                      <button type="button" onClick={() => setConfirmingReject(false)} className="h-10 rounded-md border border-[#d9e0e5] px-4 text-sm font-semibold text-[#566371]">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shown for Pending/Approved/Rejected alike — registration status
                and document/email status are two different things (Part 4);
                only the Send actions are gated to approved registrations. */}
            <div className={`mt-5 space-y-3 rounded-lg border p-4 ${isDark ? 'border-[#334258]' : 'border-[#e9edf0]'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Digital documents</p>
                {viewing.status === 'APPROVED' && (
                  <button type="button" disabled={busy === 'send-both'} onClick={() => sendBoth(viewing)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0788c5] px-2.5 text-xs font-semibold text-white hover:bg-[#0675aa] disabled:opacity-50"><MailCheck className="size-3.5" />{busy === 'send-both' ? 'Sending...' : 'Send Both'}</button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/5 px-3 py-2.5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <IdCard className="size-4 shrink-0 text-[#087fae]" />
                  <span className="text-sm font-medium">Membership Card</span>
                  <SendStatusBadge
                    sent={viewing.membershipStatus === 'SENT'}
                    failed={viewing.membershipStatus !== 'SENT' && latestEmailStatus(emailHistory, 'MEMBERSHIP_CARD') === 'FAILED'}
                    isDark={isDark}
                  />
                </div>
                {viewing.status === 'APPROVED' && (
                  <div className="flex flex-wrap gap-2">
                    {viewing.membershipCardUrl && (
                      <a href={viewing.membershipCardUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d9e0e5] px-2.5 text-xs font-semibold text-[#334155] hover:bg-[#f1f4f6]"><Download className="size-3.5" />View</a>
                    )}
                    <button type="button" disabled={busy === 'send-membership'} onClick={() => sendMembership(viewing)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0788c5] px-2.5 text-xs font-semibold text-white hover:bg-[#0675aa] disabled:opacity-50"><Send className="size-3.5" />{busy === 'send-membership' ? 'Sending...' : viewing.membershipStatus === 'SENT' ? 'Resend' : 'Send Membership Card'}</button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/5 px-3 py-2.5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <TicketCheck className="size-4 shrink-0 text-[#087fae]" />
                  <span className="text-sm font-medium">Entry Pass</span>
                  {viewing.entryPassStatus === 'NOT_APPLICABLE' ? (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? 'bg-[#1d293d] text-[#a6b2c4]' : 'bg-[#eef2f6] text-[#64748b]'}`}>Not applicable</span>
                  ) : (
                    <SendStatusBadge
                      sent={viewing.entryPassStatus === 'SENT'}
                      failed={viewing.entryPassStatus !== 'SENT' && latestEmailStatus(emailHistory, 'ENTRY_PASS') === 'FAILED'}
                      isDark={isDark}
                    />
                  )}
                </div>
                {viewing.status === 'APPROVED' && viewing.entryPassStatus !== 'NOT_APPLICABLE' && (
                  <div className="flex flex-wrap gap-2">
                    {viewing.entryPassUrl && (
                      <a href={viewing.entryPassUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#d9e0e5] px-2.5 text-xs font-semibold text-[#334155] hover:bg-[#f1f4f6]"><Download className="size-3.5" />View</a>
                    )}
                    <button type="button" disabled={busy === 'send-entry-pass'} onClick={() => sendEntryPass(viewing)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0788c5] px-2.5 text-xs font-semibold text-white hover:bg-[#0675aa] disabled:opacity-50"><Send className="size-3.5" />{busy === 'send-entry-pass' ? 'Sending...' : viewing.entryPassStatus === 'SENT' ? 'Resend' : 'Send Entry Pass'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-5 rounded-lg border p-4 ${isDark ? 'border-[#334258]' : 'border-[#e9edf0]'}`}>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Mail className="size-4" />Email history</p>
              {emailHistory.length === 0 ? (
                <p className={`text-xs ${isDark ? 'text-[#96a3b6]' : 'text-[#7d8794]'}`}>No emails sent yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {emailHistory.map((log) => (
                    <li key={log.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className={isDark ? 'text-[#e0e6ef]' : 'text-[#334155]'}>{log.subject}</span>
                      <span className={`shrink-0 font-semibold ${log.status === 'SENT' ? (isDark ? 'text-[#45d2aa]' : 'text-[#16805f]') : (isDark ? 'text-[#ff9b8f]' : 'text-[#9a3f31]')}`}>{log.status === 'SENT' ? formatDate(log.sentAt) : 'Failed'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`mt-6 flex justify-end border-t pt-4 ${isDark ? 'border-[#334258]' : 'border-[#e9edf0]'}`}>
              <button type="button" onClick={() => setViewing(null)} className={`h-10 rounded-md border px-4 text-sm font-semibold ${isDark ? 'border-[#4b5a70] text-[#e0e6ef]' : 'border-[#d9e0e5] text-[#566371]'}`}>Close</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function DetailSection({ title, isDark, children }: { title: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <div className={`mt-4 rounded-lg border p-4 first:mt-0 ${isDark ? 'border-[#334258]' : 'border-[#e9edf0]'}`}>
      <p className={`mb-3 text-xs font-bold uppercase tracking-[0.1em] ${isDark ? 'text-[#7f92ad]' : 'text-[#89939f]'}`}>{title}</p>
      <dl className="grid grid-cols-[minmax(9rem,0.4fr)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">{children}</dl>
    </div>
  )
}

function Detail({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <>
      <dt className={isDark ? 'text-[#a6b2c4]' : 'text-[#7d8794]'}>{label}</dt>
      <dd className="min-w-0 break-words font-medium">{value}</dd>
    </>
  )
}
