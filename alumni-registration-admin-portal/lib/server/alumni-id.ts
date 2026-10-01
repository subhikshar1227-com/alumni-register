// Alumni ID generation — duplicated from the alumni_2026 app's former
// lib/server/alumni-id.ts, same reasoning as prisma/schema.prisma being
// duplicated: these are separate Next.js projects with separate
// node_modules / Prisma clients that both read the SAME PostgreSQL
// database. The admin portal is now the only app that ever calls this —
// an Alumni ID is assigned once, at approval time (see the approve route).
// ALUMNI_ID_PREFIX / ALUMNI_ID_PADDING here must match the alumni_2026
// app's values, since both apps share the same AlumniIdCounter row.
import { prisma } from "./db"

const PREFIX = process.env.ALUMNI_ID_PREFIX ?? "SVCE-ALM"
const PADDING = Number(process.env.ALUMNI_ID_PADDING ?? 6)

// Atomically increments a single-row counter with one UPSERT statement,
// so concurrent approvals never receive the same Alumni ID.
export async function generateAlumniId(): Promise<string> {
  const [{ value }] = await prisma.$queryRaw<{ value: number }[]>`
    INSERT INTO "AlumniIdCounter" (id, value) VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE SET value = "AlumniIdCounter".value + 1
    RETURNING value
  `
  return `${PREFIX}-${String(value).padStart(PADDING, "0")}`
}
