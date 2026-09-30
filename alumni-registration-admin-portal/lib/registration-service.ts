export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type FoodPreference = 'VEG' | 'NON_VEG'
export type DocumentStatus = 'NOT_APPLICABLE' | 'NOT_GENERATED' | 'GENERATED' | 'SENT'

export type AlumniRegistration = {
	id: string
	alumniId: string
	name: string
	batchYear: number
	branch: string
	usn: string | null
	photoUrl: string | null
	attending: boolean
	peopleCount: number | null
	food: FoodPreference | null
	phone: string
	email: string
	company: string
	position: string | null
	awards: string | null
	experience: string | null
	linkedinUrl: string | null
	status: RegistrationStatus
	rejectionReason: string | null
	membershipStatus: DocumentStatus
	membershipCardUrl: string | null
	entryPassStatus: DocumentStatus
	entryPassUrl: string | null
	createdAt: string
	updatedAt: string
	approvedAt: string | null
	rejectedAt: string | null
}

export type EmailLogEntry = {
	id: string
	emailType: 'REGISTRATION_ACKNOWLEDGEMENT' | 'MEMBERSHIP_CARD' | 'ENTRY_PASS' | 'REJECTION' | 'OTHER'
	recipient: string
	subject: string
	status: 'SENT' | 'FAILED'
	failureReason: string | null
	sentAt: string | null
	createdAt: string
}

export type RegistrationListParams = {
	status?: RegistrationStatus
	branch?: string
	attending?: 'yes' | 'no'
	q?: string
	page?: number
	pageSize?: number
}

export type RegistrationListResult = {
	items: AlumniRegistration[]
	total: number
	page: number
	pageSize: number
}

class ApiError extends Error {}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		...init,
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
	})
	const json = await response.json().catch(() => ({}))
	if (!response.ok) throw new ApiError(json?.error || 'The request failed.')
	return json as T
}

export const registrationService = {
	async list(params: RegistrationListParams = {}): Promise<RegistrationListResult> {
		const query = new URLSearchParams()
		if (params.status) query.set('status', params.status)
		if (params.branch) query.set('branch', params.branch)
		if (params.attending) query.set('attending', params.attending)
		if (params.q) query.set('q', params.q)
		query.set('page', String(params.page ?? 1))
		query.set('pageSize', String(params.pageSize ?? 25))
		return apiFetch<RegistrationListResult>(`/api/admin/alumni?${query.toString()}`)
	},

	// Convenience for the Email workspace, which needs the full directory
	// rather than one page at a time.
	async listAll(): Promise<AlumniRegistration[]> {
		const result = await this.list({ page: 1, pageSize: 1000 })
		return result.items
	},

	async get(id: string): Promise<AlumniRegistration> {
		return apiFetch<AlumniRegistration>(`/api/admin/alumni/${id}`)
	},

	async approve(id: string): Promise<AlumniRegistration> {
		return apiFetch<AlumniRegistration>(`/api/admin/alumni/${id}/approve`, { method: 'PATCH' })
	},

	async reject(id: string, reason?: string): Promise<AlumniRegistration> {
		return apiFetch<AlumniRegistration>(`/api/admin/alumni/${id}/reject`, {
			method: 'PATCH',
			body: JSON.stringify({ reason }),
		})
	},

	async generateMembership(id: string): Promise<AlumniRegistration> {
		return apiFetch<AlumniRegistration>(`/api/admin/alumni/${id}/generate-membership`, { method: 'POST' })
	},

	async sendMembership(id: string): Promise<AlumniRegistration> {
		return apiFetch<AlumniRegistration>(`/api/admin/alumni/${id}/send-membership`, { method: 'POST' })
	},

	async generateEntryPass(id: string): Promise<AlumniRegistration> {
		return apiFetch<AlumniRegistration>(`/api/admin/alumni/${id}/generate-entry-pass`, { method: 'POST' })
	},

	async sendEntryPass(id: string): Promise<AlumniRegistration> {
		return apiFetch<AlumniRegistration>(`/api/admin/alumni/${id}/send-entry-pass`, { method: 'POST' })
	},

	async emailHistory(id: string): Promise<EmailLogEntry[]> {
		const result = await apiFetch<{ items: EmailLogEntry[] }>(`/api/admin/alumni/${id}/email-history`)
		return result.items
	},
}
