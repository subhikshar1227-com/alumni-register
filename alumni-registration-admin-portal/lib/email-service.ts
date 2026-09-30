import { registrationService, type AlumniRegistration } from '@/lib/registration-service'

export type AlumniRecipient = {
  id: string
  name: string
  email: string
  branch: string
  admissionYear: number
  graduationYear: number
}

export type AlumniYearField = 'admissionYear' | 'graduationYear'

export type RecipientFilters = {
  branch?: string
  yearField?: AlumniYearField
  year?: number
  query?: string
}

export type RecipientQuery = {
  filters: RecipientFilters
  page: number
  pageSize: number
}

export type RecipientPage = {
  items: AlumniRecipient[]
  total: number
  page: number
  pageSize: number
}

export type RecipientFacets = {
  total: number
  branches: string[]
  admissionYears: number[]
  graduationYears: number[]
}

export type RecipientSelection =
  | { kind: 'ids'; recipientIds: string[] }
  | { kind: 'filters'; filters: RecipientFilters; excludedIds: string[] }

export type RecipientDirectory = {
  allIds: string[]
  byId: Map<string, AlumniRecipient>
  byBranch: Map<string, Set<string>>
  byAdmissionYear: Map<number, Set<string>>
  byGraduationYear: Map<number, Set<string>>
}

export type EmailDraft = {
  id: string
  subject: string
  body: string
  recipientSelection: RecipientSelection
  mode: 'bulk' | 'individual'
  createdAt: string
  updatedAt: string
}

export type SentEmail = {
  id: string
  subject: string
  body: string
  recipients: AlumniRecipient[]
  recipientCount: number
  personalizedMessages?: { recipientId: string; subject: string; body: string }[]
  mode: 'bulk' | 'individual'
  sentAt: string
}

export type EmailService = {
  listRecipients(query: RecipientQuery): Promise<RecipientPage>
  getRecipientFacets(): Promise<RecipientFacets>
  getRecipientsByIds(recipientIds: string[]): Promise<AlumniRecipient[]>
  listDrafts(): Promise<EmailDraft[]>
  saveDraft(draft: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<EmailDraft>
  deleteDraft(id: string): Promise<void>
  listSent(): Promise<SentEmail[]>
  sendEmail(message: Pick<SentEmail, 'subject' | 'body' | 'mode'> & { recipientSelection: RecipientSelection }): Promise<SentEmail>
}

const STORAGE_KEYS = {
  drafts: 'svce-email-drafts-v1',
  sent: 'svce-email-sent-v1',
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readStored<T>(key: string): T[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(key)
    const value: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(value) ? value as T[] : []
  } catch {
    return []
  }
}

function writeStored<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') throw new Error('Browser storage is unavailable.')
  window.localStorage.setItem(key, JSON.stringify(value))
}

function addToIndex(index: Map<string | number, Set<string>>, key: string | number, id: string) {
  const ids = index.get(key) ?? new Set<string>()
  ids.add(id)
  index.set(key, ids)
}

export function createRecipientDirectory(recipients: AlumniRecipient[]): RecipientDirectory {
  const directory: RecipientDirectory = {
    allIds: [],
    byId: new Map(),
    byBranch: new Map(),
    byAdmissionYear: new Map(),
    byGraduationYear: new Map(),
  }

  for (const recipient of recipients) {
    directory.allIds.push(recipient.id)
    directory.byId.set(recipient.id, recipient)
    addToIndex(directory.byBranch, recipient.branch, recipient.id)
    addToIndex(directory.byAdmissionYear, recipient.admissionYear, recipient.id)
    addToIndex(directory.byGraduationYear, recipient.graduationYear, recipient.id)
  }

  return directory
}

function toRecipient(registration: AlumniRegistration): AlumniRecipient {
  return {
    id: registration.id,
    name: registration.name,
    email: registration.email,
    branch: registration.branch,
    // The registration form only collects a single batch year, so
    // admission/graduation year filters both reflect that same value.
    admissionYear: registration.batchYear,
    graduationYear: registration.batchYear,
  }
}

export function filterRecipientDirectory(directory: RecipientDirectory, filters: RecipientFilters) {
  const constraints: Set<string>[] = []

  if (filters.branch) {
    const branchIds = directory.byBranch.get(filters.branch)
    if (!branchIds) return []
    constraints.push(branchIds)
  }

  if (filters.year !== undefined) {
    const yearIndex = filters.yearField === 'admissionYear' ? directory.byAdmissionYear : directory.byGraduationYear
    const yearIds = yearIndex.get(filters.year)
    if (!yearIds) return []
    constraints.push(yearIds)
  }

  const candidates = constraints.length
    ? [...constraints.reduce((smallest, current) => current.size < smallest.size ? current : smallest)]
    : directory.allIds
  const query = (filters.query ?? '').trim().toLocaleLowerCase()

  return candidates
    .filter((id) => constraints.every((constraint) => constraint.has(id)))
    .map((id) => directory.byId.get(id))
    .filter((recipient): recipient is AlumniRecipient => Boolean(recipient))
    .filter((recipient) => !query || `${recipient.name} ${recipient.email} ${recipient.branch}`.toLocaleLowerCase().includes(query))
}

function normalizeDrafts() {
  type StoredDraft = Omit<EmailDraft, 'recipientSelection'> & {
    recipientSelection?: RecipientSelection
    recipientIds?: string[]
  }

  return readStored<StoredDraft>(STORAGE_KEYS.drafts).map((draft) => ({
    ...draft,
    recipientSelection: draft.recipientSelection ?? { kind: 'ids', recipientIds: draft.recipientIds ?? [] },
  }))
}

function normalizeSentMessages() {
  type StoredSent = Omit<SentEmail, 'recipientCount'> & { recipientCount?: number }

  return readStored<StoredSent>(STORAGE_KEYS.sent).map((message) => ({
    ...message,
    recipientCount: message.recipientCount ?? message.recipients.length,
  }))
}

export const emailService: EmailService = {
  async listRecipients({ filters, page, pageSize }) {
    const recipients = (await registrationService.listAll()).map(toRecipient)
    const matches = filterRecipientDirectory(createRecipientDirectory(recipients), filters)
    const safePageSize = Math.max(1, Math.min(100, pageSize))
    const safePage = Math.max(1, page)
    const start = (safePage - 1) * safePageSize

    return {
      items: matches.slice(start, start + safePageSize).map((recipient) => ({ ...recipient })),
      total: matches.length,
      page: safePage,
      pageSize: safePageSize,
    }
  },

  async getRecipientFacets() {
    const recipients = (await registrationService.listAll()).map(toRecipient)
    return {
      total: recipients.length,
      branches: [...new Set(recipients.map((recipient) => recipient.branch))].sort(),
      admissionYears: [...new Set(recipients.map((recipient) => recipient.admissionYear))].sort((left, right) => right - left),
      graduationYears: [...new Set(recipients.map((recipient) => recipient.graduationYear))].sort((left, right) => right - left),
    }
  },

  async getRecipientsByIds(recipientIds) {
    const ids = new Set(recipientIds)
    return (await registrationService.listAll()).map(toRecipient).filter((recipient) => ids.has(recipient.id))
  },

  async listDrafts() {
    return normalizeDrafts().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  },

  async saveDraft(draft) {
    const drafts = normalizeDrafts()
    const now = new Date().toISOString()
    const existing = draft.id ? drafts.find((item) => item.id === draft.id) : undefined
    const saved: EmailDraft = {
      ...draft,
      id: existing?.id ?? draft.id ?? createId(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    writeStored(STORAGE_KEYS.drafts, [saved, ...drafts.filter((item) => item.id !== saved.id)])
    return saved
  },

  async deleteDraft(id) {
    writeStored(STORAGE_KEYS.drafts, normalizeDrafts().filter((draft) => draft.id !== id))
  },

  async listSent() {
    const messages = normalizeSentMessages().filter((message) => !message.recipients.some((recipient) => recipient.id.startsWith('mock-')))
    if (messages.length !== normalizeSentMessages().length) writeStored(STORAGE_KEYS.sent, messages)
    return messages.sort((left, right) => right.sentAt.localeCompare(left.sentAt))
  },

  async sendEmail(message) {
    const recipients = (await registrationService.listAll()).map(toRecipient)
    const recipientsById = new Map(recipients.map((recipient) => [recipient.id, recipient]))
    const directory = createRecipientDirectory(recipients)
    const selection = message.recipientSelection
    const selectedRecipients = selection.kind === 'ids'
      ? [...new Set(selection.recipientIds)]
        .map((id) => recipientsById.get(id))
        .filter((recipient): recipient is AlumniRecipient => Boolean(recipient))
      : (() => {
        const excludedIds = new Set(selection.excludedIds)
        return filterRecipientDirectory(directory, selection.filters)
          .filter((recipient) => !excludedIds.has(recipient.id))
      })()

    if (selectedRecipients.length === 0) throw new Error('Choose at least one current alumni registration before sending.')
    if (!message.subject.trim() || !message.body.trim()) throw new Error('Add a subject and message before sending.')

    const personalize = (text: string, recipient: AlumniRecipient) => text.replace(/{{\s*(name|email|branch|admissionYear|graduationYear|batchYear)\s*}}/g, (_, key: string) => {
      const values: Record<string, string> = {
        name: recipient.name,
        email: recipient.email,
        branch: recipient.branch,
        admissionYear: String(recipient.admissionYear),
        graduationYear: String(recipient.graduationYear),
        batchYear: String(recipient.graduationYear),
      }

      return values[key]
    })
    const personalizedMessages = selectedRecipients.slice(0, 4).map((recipient) => ({
      recipientId: recipient.id,
      subject: personalize(message.subject, recipient),
      body: personalize(message.body, recipient),
    }))
    const sent: SentEmail = {
      ...message,
      id: createId(),
      recipients: selectedRecipients.slice(0, 4),
      recipientCount: selectedRecipients.length,
      personalizedMessages,
      sentAt: new Date().toISOString(),
    }
    writeStored(STORAGE_KEYS.sent, [sent, ...normalizeSentMessages()].slice(0, 500))
    return sent
  },
}