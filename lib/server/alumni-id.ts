import { prisma } from "./db"

// Format is configurable via env — defaults produce SVCE-ALM-000001.
const PREFIX = process.env.ALUMNI_ID_PREFIX ?? "SVCE-ALM"
const PADDING = Number(process.env.ALUMNI_ID_PADDING ?? 6)

// Atomically increments a single-row counter with one UPSERT statement,
// so concurrent registrations never receive the same Alumni ID.
export async function generateAlumniId(): Promise<string> {
  const [{ value }] = await prisma.$queryRaw<{ value: number }[]>`
    INSERT INTO "AlumniIdCounter" (id, value) VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE SET value = "AlumniIdCounter".value + 1
    RETURNING value
  `
  return `${PREFIX}-${String(value).padStart(PADDING, "0")}`
}
