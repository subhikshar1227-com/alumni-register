'use client'

import { useDeferredValue, useEffect, useState } from 'react'
import {
  Check,
  Clock3,
  FileText,
  Mail,
  MessageSquare,
  Save,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import {
  emailService,
  type AlumniRecipient,
  type EmailDraft,
  type RecipientFacets,
  type RecipientFilters,
  type RecipientPage,
  type RecipientSelection,
  type SentEmail,
} from '@/lib/email-service'

type EmailMode = 'bulk' | 'individual'
type WorkspaceTab = 'compose' | 'drafts' | 'sent'
const recipientPageSize = 25

const templates = [
  {
    id: 'custom',
    name: 'Custom message',
    subject: '',
    body: '',
  },
  {
    id: 'reunion',
    name: 'Jubilee invitation',
    subject: 'You are invited to the SVCE Silver Jubilee',
    body: 'Hi {{name}},\n\nWe would love to welcome you back to SVCE for our Silver Jubilee. As a {{branch}} graduate from {{graduationYear}}, your place in our alumni community is part of this celebration.\n\nWe hope to see you there!',
  },
  {
    id: 'update',
    name: 'Alumni update',
    subject: 'A quick update from SVCE Alumni',
    body: 'Hi {{name}},\n\nWe are sharing an update with our {{branch}} alumni from the {{graduationYear}} batch.\n\nMore details will follow soon.',
  },
  {
    id: 'thanks',
    name: 'Thank you',
    subject: 'Thank you for being part of SVCE',
    body: 'Hi {{name}},\n\nThank you for staying connected with SVCE. We are glad to have you as part of our alumni community.\n\nWarm regards,\nSVCE Alumni Team',
  },
]

function personalize(text: string, recipient?: AlumniRecipient) {
  if (!recipient) return text

  const values: Record<string, string> = {
    name: recipient.name,
    email: recipient.email,
    branch: recipient.branch,
    admissionYear: String(recipient.admissionYear),
    graduationYear: String(recipient.graduationYear),
    batchYear: String(recipient.graduationYear),
  }

  return text.replace(/{{\s*(name|email|branch|admissionYear|graduationYear|batchYear)\s*}}/g, (_, key: string) => values[key])
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function EmailWorkspace() {
  const [recipientPage, setRecipientPage] = useState<RecipientPage | null>(null)
  const [facets, setFacets] = useState<RecipientFacets>({ total: 0, branches: [], admissionYears: [], graduationYears: [] })
  const [recipientCache, setRecipientCache] = useState<Map<string, AlumniRecipient>>(new Map())
  const [drafts, setDrafts] = useState<EmailDraft[]>([])
  const [sentMessages, setSentMessages] = useState<SentEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<WorkspaceTab>('compose')
  const [mode, setMode] = useState<EmailMode>('bulk')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [allMatchingFilters, setAllMatchingFilters] = useState<RecipientFilters | null>(null)
  const [excludedIds, setExcludedIds] = useState<string[]>([])
  const [branchFilter, setBranchFilter] = useState('')
  const [yearField, setYearField] = useState<'admissionYear' | 'graduationYear'>('graduationYear')
  const [yearFilter, setYearFilter] = useState('')
  const [search, setSearch] = useState('')
  const [recipientPageNumber, setRecipientPageNumber] = useState(1)
  const [templateId, setTemplateId] = useState('custom')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>()
  const [confirmingSend, setConfirmingSend] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    Promise.all([emailService.getRecipientFacets(), emailService.listDrafts(), emailService.listSent()])
      .then(([loadedFacets, loadedDrafts, loadedSent]) => {
        setFacets(loadedFacets)
        setDrafts(loadedDrafts)
        setSentMessages(loadedSent)
      })
      .catch(() => setError('Could not load email workspace data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let current = true
    setLoading(true)
    emailService.listRecipients({
      filters: {
        branch: branchFilter || undefined,
        yearField,
        year: yearFilter ? Number(yearFilter) : undefined,
        query: deferredSearch.trim() || undefined,
      },
      page: recipientPageNumber,
      pageSize: recipientPageSize,
    }).then((result) => {
      if (!current) return
      setRecipientPage(result)
      setRecipientCache((cached) => {
        const next = new Map(cached)
        for (const recipient of result.items) next.set(recipient.id, recipient)
        return next
      })
    }).catch(() => {
      if (current) setError('Could not load recipients. Try adjusting the filters.')
    }).finally(() => {
      if (current) setLoading(false)
    })

    return () => { current = false }
  }, [branchFilter, deferredSearch, yearField, yearFilter, recipientPageNumber])

  const visibleRecipients = recipientPage?.items ?? []
  const totalMatches = recipientPage?.total ?? 0
  const visibleIds = visibleRecipients.map((recipient) => recipient.id)
  const selectedSet = new Set(selectedIds)
  const excludedSet = new Set(excludedIds)
  const selectedCount = allMatchingFilters ? Math.max(0, totalMatches - excludedIds.length) : selectedIds.length
  const selectedRecipients = allMatchingFilters
    ? visibleRecipients.filter((recipient) => !excludedSet.has(recipient.id))
    : selectedIds.map((id) => recipientCache.get(id)).filter((recipient): recipient is AlumniRecipient => Boolean(recipient))
  const branches = facets.branches
  const years = yearField === 'admissionYear' ? facets.admissionYears : facets.graduationYears
  const previewRecipient = selectedRecipients[0]
  const canSend = selectedCount > 0 && Boolean(subject.trim()) && Boolean(body.trim())

  function activeRecipientFilters(): RecipientFilters {
    return {
      branch: branchFilter || undefined,
      yearField,
      year: yearFilter ? Number(yearFilter) : undefined,
      query: deferredSearch.trim() || undefined,
    }
  }

  function recipientSelection(): RecipientSelection {
    return allMatchingFilters
      ? { kind: 'filters', filters: allMatchingFilters, excludedIds }
      : { kind: 'ids', recipientIds: selectedIds }
  }

  function resetRecipientSelection() {
    setSelectedIds([])
    setAllMatchingFilters(null)
    setExcludedIds([])
  }

  function toggleRecipient(id: string, checked: boolean) {
    if (allMatchingFilters) {
      setExcludedIds((current) => checked ? current.filter((excludedId) => excludedId !== id) : [...new Set([...current, id])])
      return
    }

    setSelectedIds((current) => {
      if (mode === 'individual') return checked ? [id] : []
      return checked ? [...new Set([...current, id])] : current.filter((selectedId) => selectedId !== id)
    })
  }

  function toggleVisibleRecipients() {
    if (allMatchingFilters) {
      setAllMatchingFilters(null)
      setExcludedIds([])
      setSelectedIds([])
    } else {
      setAllMatchingFilters(activeRecipientFilters())
      setSelectedIds([])
      setExcludedIds([])
    }
  }

  function startIndividualMessage(recipient: AlumniRecipient) {
    setMode('individual')
    setSelectedIds([recipient.id])
    setAllMatchingFilters(null)
    setExcludedIds([])
    setTab('compose')
    setEditingDraftId(undefined)
    setError('')
    setNotice('')
  }

  function startBulkMessage() {
    setMode('bulk')
    resetRecipientSelection()
    setTab('compose')
    setEditingDraftId(undefined)
  }

  function applyTemplate(id: string) {
    const template = templates.find((item) => item.id === id) ?? templates[0]
    setTemplateId(id)
    setSubject(template.subject)
    setBody(template.body)
  }

  async function saveCurrentDraft() {
    setError('')
    setNotice('')
    try {
      const saved = await emailService.saveDraft({
        id: editingDraftId,
        subject,
        body,
        recipientSelection: recipientSelection(),
        mode,
      })
      setDrafts(await emailService.listDrafts())
      setEditingDraftId(saved.id)
      setNotice('Draft saved in this browser.')
    } catch {
      setError('Could not save the draft. Check browser storage settings.')
    }
  }

  function openDraft(draft: EmailDraft) {
    setEditingDraftId(draft.id)
    setMode(draft.mode)
    setSelectedIds(draft.recipientSelection.kind === 'ids' ? draft.recipientSelection.recipientIds : [])
    setAllMatchingFilters(draft.recipientSelection.kind === 'filters' ? draft.recipientSelection.filters : null)
    setExcludedIds(draft.recipientSelection.kind === 'filters' ? draft.recipientSelection.excludedIds : [])
    if (draft.recipientSelection.kind === 'filters') {
      setBranchFilter(draft.recipientSelection.filters.branch ?? '')
      setYearField(draft.recipientSelection.filters.yearField ?? 'graduationYear')
      setYearFilter(draft.recipientSelection.filters.year?.toString() ?? '')
      setSearch(draft.recipientSelection.filters.query ?? '')
      setRecipientPageNumber(1)
    } else if (draft.recipientSelection.recipientIds.length > 0) {
      emailService.getRecipientsByIds(draft.recipientSelection.recipientIds).then((found) => {
        setRecipientCache((cached) => new Map([...cached, ...found.map((recipient) => [recipient.id, recipient] as const)]))
      })
    }
    setSubject(draft.subject)
    setBody(draft.body)
    setTemplateId('custom')
    setTab('compose')
    setNotice('Draft opened.')
    setError('')
  }

  async function deleteDraft(id: string) {
    await emailService.deleteDraft(id)
    setDrafts(await emailService.listDrafts())
    if (editingDraftId === id) setEditingDraftId(undefined)
  }

  async function sendCurrentMessage() {
    setError('')
    try {
      const sent = await emailService.sendEmail({ subject, body, recipientSelection: recipientSelection(), mode })
      setSentMessages(await emailService.listSent())
      setConfirmingSend(false)
      setTab('sent')
      setNotice(`Saved to local sent history for ${sent.recipientCount} recipient${sent.recipientCount === 1 ? '' : 's'}. No email was delivered.`)
      if (editingDraftId) {
        await emailService.deleteDraft(editingDraftId)
        setDrafts(await emailService.listDrafts())
        setEditingDraftId(undefined)
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Could not save this message to sent history.')
      setConfirmingSend(false)
    }
  }

  return (
    <section aria-labelledby="email-workspace-title" className="space-y-5">
      <div className="flex flex-col justify-between gap-4 border-b border-[#e6e9ee] pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#47798a]"><Mail className="size-4" /> Local demo mode</div>
          <h2 id="email-workspace-title" className="text-2xl font-bold text-[#18202b]">Email desk</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#7d8794]">Compose personalized messages for alumni. Drafts and sent history stay in this browser; sending is simulated.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#697583]"><Users className="size-4" /><span>{facets.total} demo alumni</span></div>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-[#e6e9ee]" role="tablist" aria-label="Email workspace views">
        {([
          ['compose', 'Compose', Send],
          ['drafts', 'Drafts', FileText],
          ['sent', 'Sent history', Clock3],
        ] as const).map(([value, label, Icon]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => { setTab(value); setNotice(''); setError('') }} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${tab === value ? 'border-[#176b87] text-[#183b56]' : 'border-transparent text-[#7d8794] hover:text-[#183b56]'}`}>
            <Icon className="size-4" />{label}
            {value === 'drafts' && drafts.length > 0 && <span className="rounded-full bg-[#edf4f7] px-2 py-0.5 text-[11px]">{drafts.length}</span>}
            {value === 'sent' && sentMessages.length > 0 && <span className="rounded-full bg-[#edf4f7] px-2 py-0.5 text-[11px]">{sentMessages.length}</span>}
          </button>
        ))}
      </div>

      {notice && <p role="status" className="rounded-md border border-[#cfe5d9] bg-[#f1faf4] px-4 py-3 text-sm text-[#246747]">{notice}</p>}
      {error && <p role="alert" className="rounded-md border border-[#f0d3cf] bg-[#fff7f5] px-4 py-3 text-sm text-[#9a3f31]">{error}</p>}

      {tab === 'compose' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section className="min-w-0" aria-labelledby="recipients-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div><h3 id="recipients-heading" className="font-bold text-[#18202b]">Recipients</h3><p className="mt-1 text-xs text-[#89939f]">{mode === 'individual' ? 'Choose one person for a direct message.' : 'Select alumni across one or more branches and years.'}</p></div>
              <div className="flex rounded-md border border-[#dfe4e9] p-0.5" aria-label="Message type">
                <button type="button" onClick={startBulkMessage} aria-pressed={mode === 'bulk'} className={`rounded px-2.5 py-1.5 text-xs font-semibold ${mode === 'bulk' ? 'bg-[#edf4f7] text-[#183b56]' : 'text-[#697583]'}`}>Bulk</button>
                <button type="button" onClick={() => { setMode('individual'); setSelectedIds(selectedRecipients.slice(0, 1).map((recipient) => recipient.id)); setAllMatchingFilters(null); setExcludedIds([]) }} aria-pressed={mode === 'individual'} className={`rounded px-2.5 py-1.5 text-xs font-semibold ${mode === 'individual' ? 'bg-[#edf4f7] text-[#183b56]' : 'text-[#697583]'}`}>Individual</button>
              </div>
            </div>

            <div className="rounded-lg border border-[#e1e5e9] bg-white">
              <div className="grid gap-3 border-b border-[#eef0f3] p-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#697583]">Branch
                  <select value={branchFilter} onChange={(event) => { setBranchFilter(event.target.value); resetRecipientSelection(); setRecipientPageNumber(1) }} className="mt-1.5 h-10 w-full rounded-md border border-[#dfe4e9] bg-white px-3 text-sm font-normal text-[#18202b] outline-none focus:border-[#8ba6b1]"><option value="">All branches</option>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select>
                </label>
                <div className="grid grid-cols-[1.2fr_0.8fr] gap-2">
                  <label className="text-xs font-semibold text-[#697583]">Year type
                    <select value={yearField} onChange={(event) => { setYearField(event.target.value as 'admissionYear' | 'graduationYear'); setYearFilter(''); resetRecipientSelection(); setRecipientPageNumber(1) }} className="mt-1.5 h-10 w-full rounded-md border border-[#dfe4e9] bg-white px-2 text-sm font-normal text-[#18202b] outline-none focus:border-[#8ba6b1]"><option value="graduationYear">Graduation</option><option value="admissionYear">Admission</option></select>
                  </label>
                  <label className="text-xs font-semibold text-[#697583]">Year
                    <select value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); resetRecipientSelection(); setRecipientPageNumber(1) }} className="mt-1.5 h-10 w-full rounded-md border border-[#dfe4e9] bg-white px-2 text-sm font-normal text-[#18202b] outline-none focus:border-[#8ba6b1]"><option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-b border-[#eef0f3] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa3ae]" /><input value={search} onChange={(event) => { setSearch(event.target.value); resetRecipientSelection(); setRecipientPageNumber(1) }} placeholder="Search name or email" className="h-10 w-full rounded-md border border-[#dfe4e9] bg-[#fafbfc] pl-9 pr-3 text-sm outline-none placeholder:text-[#a5adb7] focus:border-[#8ba6b1]" /></div>
                {mode === 'bulk' && <button type="button" onClick={toggleVisibleRecipients} disabled={visibleIds.length === 0 || deferredSearch !== search} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#dfe4e9] px-3 text-xs font-semibold text-[#183b56] hover:bg-[#f7f8fa] disabled:opacity-50">{allMatchingFilters ? <X className="size-4" /> : <Check className="size-4" />}{allMatchingFilters ? 'Clear selection' : `Select all ${totalMatches} matches`}</button>}
              </div>
              <div className="max-h-[420px] overflow-y-auto" aria-live="polite">
                {loading ? <p className="p-6 text-center text-sm text-[#89939f]">Loading recipients...</p> : visibleRecipients.length === 0 ? <p className="p-6 text-center text-sm text-[#89939f]">No alumni match these filters.</p> : visibleRecipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center gap-3 border-b border-[#f0f2f4] px-4 py-3 last:border-b-0 hover:bg-[#fbfcfd]">
                    {mode === 'bulk' && <input type="checkbox" checked={allMatchingFilters ? !excludedSet.has(recipient.id) : selectedSet.has(recipient.id)} onChange={(event) => toggleRecipient(recipient.id, event.target.checked)} aria-label={`Select ${recipient.name}`} className="size-4 shrink-0 accent-[#176b87]" />}
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaf3f7] text-xs font-bold text-[#176b87]">{recipient.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#18202b]">{recipient.name}</p><p className="truncate text-xs text-[#89939f]">{recipient.email}</p></div>
                    <div className="hidden min-w-[110px] text-right sm:block"><p className="truncate text-xs font-medium text-[#697583]">{recipient.branch}</p><p className="mt-0.5 text-[11px] text-[#89939f]">Class of {recipient.graduationYear}</p></div>
                    <button type="button" onClick={() => startIndividualMessage(recipient)} aria-label={`Message ${recipient.name} individually`} title="Start individual message" className="flex size-9 shrink-0 items-center justify-center rounded-md text-[#47798a] hover:bg-[#edf4f7]"><MessageSquare className="size-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eef0f3] px-4 py-3 text-xs text-[#89939f]"><span>Showing {totalMatches === 0 ? 0 : (recipientPageNumber - 1) * recipientPageSize + 1}-{Math.min(recipientPageNumber * recipientPageSize, totalMatches)} of {totalMatches}</span><span className="font-semibold text-[#183b56]">{selectedCount} selected</span><div className="flex items-center gap-1"><button type="button" aria-label="Previous recipient page" disabled={recipientPageNumber <= 1 || loading} onClick={() => setRecipientPageNumber((current) => current - 1)} className="rounded border border-[#dfe4e9] px-2 py-1 disabled:opacity-40">Previous</button><button type="button" aria-label="Next recipient page" disabled={recipientPageNumber * recipientPageSize >= totalMatches || loading} onClick={() => setRecipientPageNumber((current) => current + 1)} className="rounded border border-[#dfe4e9] px-2 py-1 disabled:opacity-40">Next</button></div></div>
            </div>
          </section>

          <section className="min-w-0" aria-labelledby="message-heading">
            <div className="mb-3 flex items-center justify-between gap-3"><div><h3 id="message-heading" className="font-bold text-[#18202b]">Message</h3><p className="mt-1 text-xs text-[#89939f]">Personalization updates in the preview.</p></div>{editingDraftId && <span className="rounded bg-[#edf4f7] px-2 py-1 text-[11px] font-semibold text-[#47798a]">Editing draft</span>}</div>
            <div className="space-y-4 rounded-lg border border-[#e1e5e9] bg-white p-4 sm:p-5">
              <label className="block text-xs font-semibold text-[#697583]">Template
                <select value={templateId} onChange={(event) => applyTemplate(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-[#dfe4e9] bg-white px-3 text-sm font-normal text-[#18202b] outline-none focus:border-[#8ba6b1]">{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
              </label>
              <label className="block text-xs font-semibold text-[#697583]">Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={180} placeholder="Add a subject" className="mt-1.5 h-10 w-full rounded-md border border-[#dfe4e9] px-3 text-sm font-normal text-[#18202b] outline-none placeholder:text-[#a5adb7] focus:border-[#8ba6b1]" /></label>
              <label className="block text-xs font-semibold text-[#697583]">Email body<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={7} maxLength={10000} placeholder="Write your message. Personalize with {{name}}, {{branch}}, {{admissionYear}}, or {{graduationYear}}." className="mt-1.5 w-full resize-y rounded-md border border-[#dfe4e9] px-3 py-2.5 text-sm font-normal leading-6 text-[#18202b] outline-none placeholder:text-[#a5adb7] focus:border-[#8ba6b1]" /></label>
              <p className="text-[11px] leading-5 text-[#89939f]">Tokens: <code>{'{{name}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{branch}}'}</code>, <code>{'{{admissionYear}}'}</code>, <code>{'{{graduationYear}}'}</code>, <code>{'{{batchYear}}'}</code></p>

              <div className="border-t border-[#eef0f3] pt-4">
                <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold text-[#697583]">Preview</p>{previewRecipient && <p className="max-w-[65%] truncate text-[11px] text-[#89939f]">For {previewRecipient.name}</p>}</div>
                <div className="min-h-[150px] rounded-md bg-[#f7f8fa] p-4"><p className="mb-3 text-sm font-semibold text-[#18202b]">{personalize(subject, previewRecipient) || 'Subject preview'}</p><p className="whitespace-pre-wrap text-sm leading-6 text-[#566371]">{personalize(body, previewRecipient) || 'Your personalized message preview will appear here.'}</p></div>
              </div>
              <div className="flex flex-col gap-2 border-t border-[#eef0f3] pt-4 sm:flex-row sm:justify-between">
                <button type="button" onClick={saveCurrentDraft} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#dfe4e9] px-3 text-sm font-semibold text-[#183b56] hover:bg-[#f7f8fa]"><Save className="size-4" />Save draft</button>
                <button type="button" disabled={!canSend} onClick={() => setConfirmingSend(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#176b87] px-4 text-sm font-semibold text-white hover:bg-[#12566d] disabled:cursor-not-allowed disabled:opacity-45"><Send className="size-4" />Review send · {selectedCount}</button>
              </div>
              <p className="text-[11px] leading-5 text-[#89939f]">Demo only: send saves a record to local sent history. It does not deliver email or schedule campaigns.</p>
            </div>
          </section>
        </div>
      )}

      {tab === 'drafts' && (
        <section aria-labelledby="drafts-heading">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h3 id="drafts-heading" className="font-bold text-[#18202b]">Saved drafts</h3><p className="mt-1 text-xs text-[#89939f]">Stored in this browser only.</p></div><button type="button" onClick={startBulkMessage} className="inline-flex h-9 items-center gap-2 rounded-md border border-[#dfe4e9] px-3 text-xs font-semibold text-[#183b56] hover:bg-[#f7f8fa]"><Mail className="size-4" />New message</button></div>
          {drafts.length === 0 ? <p className="rounded-lg border border-dashed border-[#dfe4e9] px-6 py-12 text-center text-sm text-[#89939f]">No drafts saved yet.</p> : <div className="divide-y divide-[#eef0f3] border-y border-[#e6e9ee]">{drafts.map((draft) => <article key={draft.id} className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#18202b]">{draft.subject || 'Untitled draft'}</p><p className="mt-1 text-xs text-[#89939f]">{draft.mode === 'individual' ? 'Individual' : 'Bulk'} · {draft.recipientSelection.kind === 'ids' ? `${draft.recipientSelection.recipientIds.length} selected` : 'All matching filters'} · Updated {formatDate(draft.updatedAt)}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => openDraft(draft)} className="h-9 rounded-md border border-[#dfe4e9] px-3 text-xs font-semibold text-[#183b56] hover:bg-[#f7f8fa]">Open draft</button><button type="button" onClick={() => deleteDraft(draft.id)} aria-label={`Delete draft ${draft.subject || 'Untitled draft'}`} className="flex size-9 items-center justify-center rounded-md text-[#9a5147] hover:bg-[#fff3f1]"><Trash2 className="size-4" /></button></div></article>)}</div>}
        </section>
      )}

      {tab === 'sent' && (
        <section aria-labelledby="sent-heading">
          <div className="mb-4"><h3 id="sent-heading" className="font-bold text-[#18202b]">Sent history</h3><p className="mt-1 text-xs text-[#89939f]">Local simulation history; messages are not delivered.</p></div>
          {sentMessages.length === 0 ? <p className="rounded-lg border border-dashed border-[#dfe4e9] px-6 py-12 text-center text-sm text-[#89939f]">No messages in local history.</p> : <div className="divide-y divide-[#eef0f3] border-y border-[#e6e9ee]">{sentMessages.map((message) => <article key={message.id} className="py-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#18202b]">{personalize(message.personalizedMessages?.[0]?.subject ?? message.subject, message.recipients[0])}</p><p className="mt-1 text-xs text-[#697583]">{message.mode === 'individual' ? 'Individual message' : 'Bulk message'} · {message.recipientCount} recipient{message.recipientCount === 1 ? '' : 's'}</p></div><time className="shrink-0 text-xs text-[#89939f]">{formatDate(message.sentAt)}</time></div><p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-[#89939f]">{personalize(message.personalizedMessages?.[0]?.body ?? message.body, message.recipients[0])}</p><p className="mt-2 truncate text-[11px] text-[#89939f]">To: {message.recipients.slice(0, 4).map((recipient) => recipient.email).join(', ')}{message.recipientCount > message.recipients.length ? ` and ${message.recipientCount - message.recipients.length} more` : ''}</p></article>)}</div>}
        </section>
      )}

      {confirmingSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18202b]/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmingSend(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-send-title" className="w-full max-w-lg rounded-lg border border-[#e1e5e9] bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4"><div><h3 id="confirm-send-title" className="font-bold text-[#18202b]">Review message</h3><p className="mt-1 text-sm text-[#697583]">{mode === 'individual' ? 'Individual message' : 'Bulk message'} to {selectedCount} recipient{selectedCount === 1 ? '' : 's'}.</p></div><button type="button" onClick={() => setConfirmingSend(false)} aria-label="Close review" className="flex size-8 items-center justify-center rounded-md text-[#697583] hover:bg-[#f4f6f8]"><X className="size-4" /></button></div>
            <div className="mb-4 rounded-md bg-[#f7f8fa] p-3"><p className="text-xs font-semibold text-[#697583]">Subject</p><p className="mt-1 text-sm text-[#18202b]">{subject}</p><p className="mt-3 text-xs font-semibold text-[#697583]">Recipients</p><p className="mt-1 max-h-20 overflow-y-auto text-xs leading-5 text-[#566371]">{selectedRecipients.slice(0, 4).map((recipient) => recipient.email).join(', ')}{selectedCount > 4 ? ` and ${selectedCount - 4} more` : ''}</p></div>
            <p className="mb-5 text-xs leading-5 text-[#9a5147]">This local demo records the message in browser history only. No email will be sent.</p>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirmingSend(false)} className="h-10 rounded-md border border-[#dfe4e9] px-4 text-sm font-semibold text-[#566371]">Cancel</button><button type="button" onClick={sendCurrentMessage} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#176b87] px-4 text-sm font-semibold text-white hover:bg-[#12566d]"><Send className="size-4" />Save to sent history</button></div>
          </section>
        </div>
      )}
    </section>
  )
}