# Email workspace integration

**Status: the Dashboard / Alumni registrations view is now backed by the real
PostgreSQL database** via `registrationService` in `lib/registration-service.ts`,
which calls the `/api/admin/alumni/*` routes (see the root-level setup notes
for the full API list, auth, and document generation). There is no more
`svce-registrations-v1` browser storage and no "Add Recipient" dialog —
every alumni registration originates from the public `alumni_2026` form.

The **Email workspace** (bulk/individual marketing-style composer) below is
still a local demo: it reads the *real* recipient directory (via
`registrationService.listAll()`) but drafts and "sent" history are still
simulated in browser `localStorage`, and Send does not deliver mail. This is
intentionally separate from the registration workflow's real transactional
emails (acknowledgement / membership card / entry pass), which are sent
server-side by the `/api/admin/alumni/:id/send-*` routes and nodemailer.

## Stack

- Frontend: Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4.
- Database: PostgreSQL via Prisma, shared with the `alumni_2026` app (same `DATABASE_URL`, schema in `prisma/schema.prisma`, migrations owned by `alumni_2026`).
- Email provider: SMTP via `nodemailer` (`lib/server/mailer.ts`), configured with `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_USER`/`EMAIL_PASSWORD`/`EMAIL_FROM`.

## If you want to make the Email workspace real too

Implement the existing `EmailService` methods (`lib/email-service.ts`) with
`fetch` calls to real endpoints, preserving their request and return shapes —
the UI calls only this interface. `registrationService.listAll()` already
gives it the real directory; only drafts/sent history and actual delivery
remain to be backed by real storage and a `/api/admin/email-messages`-style
endpoint if this feature is needed beyond a demo.

### Recipient contracts

`listRecipients(query)` accepts:

```ts
{
	filters: {
		branch?: string
		yearField?: 'admissionYear' | 'graduationYear'
		year?: number
		query?: string
	}
	page: number
	pageSize: number
}
```

It returns a `RecipientPage` with the requested page and a total count across all matches:

```ts
{
	items: AlumniRecipient[]
	total: number
	page: number
	pageSize: number
}
```

`getRecipientFacets()` returns `{ total, branches, admissionYears, graduationYears }` to populate filters without loading every recipient. `getRecipientsByIds(ids)` returns matching `AlumniRecipient[]` records for previews of explicit draft selections. Each recipient has `{ id, name, email, branch, admissionYear, graduationYear }`. These fields are projected from the same `AlumniRegistration` records used by the roster; there is no independent email recipient fixture.

### Draft and send contracts

Drafts contain `id`, `subject`, `body`, `mode`, timestamps, and a `recipientSelection`. Selections are a discriminated union:

```ts
{ kind: 'ids', recipientIds: string[] }
{ kind: 'filters', filters: RecipientFilters, excludedIds: string[] }
```

The filter form means “all recipients matching these filters except these IDs,” so select-all works across pages without transferring the entire directory to the browser. `sendEmail({ subject, body, mode, recipientSelection })` resolves that selection on the service side and returns:

```ts
{
	id: string
	subject: string
	body: string
	mode: 'bulk' | 'individual'
	sentAt: string // ISO-8601 timestamp
	recipientCount: number
	recipients: AlumniRecipient[] // small display sample, not the full directory
	personalizedMessages?: { recipientId: string; subject: string; body: string }[]
}
```

`listDrafts()` returns `EmailDraft[]` with `{ id, subject, body, recipientSelection, mode, createdAt, updatedAt }`. `saveDraft({ id?, subject, body, recipientSelection, mode })` returns the saved `EmailDraft`; `deleteDraft(id)` returns `void`. `listSent()` returns `SentEmail[]`. A production adapter must apply filter selections and exclusions atomically against the same current recipient set when submitting.

A typical API mapping is:

- `listRecipients`: `GET /api/alumni?branch=...&yearField=graduationYear&year=2015&query=...&page=1&pageSize=25`
- `RegistrationService.list/create/updateStatus`: `GET`/`POST`/`PATCH /api/alumni` (or their equivalent resource endpoints)
- `getRecipientFacets`: `GET /api/alumni/facets`
- `getRecipientsByIds`: `POST /api/alumni/lookup` with `{ ids: string[] }`
- `listDrafts`, `saveDraft`, `deleteDraft`: `GET`, `POST`/`PUT`, and `DELETE /api/email-drafts`
- `listSent`: `GET /api/email-messages?status=sent`
- `sendEmail`: `POST /api/email-messages` with `{ subject, body, mode, recipientSelection }`

Map server JSON into the types above in the adapter. For example, an `EmailDraft` response must include timestamps and the discriminated recipient selection; a `SentEmail` response must include the total `recipientCount` even if only a small recipient sample is returned. The current UI uses that count for confirmation and history.

Replace the local `emailService` implementation with the API adapter, mapping the endpoint response into these same shapes. The interface already supports server-filtered pagination and filter-based sends, so no UI changes are needed when switching adapters. The local adapter builds branch/admission-year/graduation-year indexes, defers search input, and returns one page of at most 25 recipients at a time.

Before enabling real delivery, add authenticated/authorized endpoints, server-side recipient validation, consent/unsubscribe checks, rate limiting, and delivery error handling. The browser-only `sendEmail` implementation is a history simulation, not an email service.