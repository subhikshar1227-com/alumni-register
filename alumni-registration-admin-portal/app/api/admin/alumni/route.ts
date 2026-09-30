import { NextResponse } from "next/server"
import type { Prisma, RegistrationStatus } from "@prisma/client"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"

const VALID_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const branch = searchParams.get("branch")
  const attending = searchParams.get("attending")
  const query = searchParams.get("q")?.trim()
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 25)))

  const where: Prisma.AlumniRegistrationWhereInput = {}
  if (status && VALID_STATUSES.has(status)) where.status = status as RegistrationStatus
  if (branch) where.branch = branch
  if (attending === "yes") where.attending = true
  if (attending === "no") where.attending = false
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { usn: { contains: query, mode: "insensitive" } },
      { alumniId: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.alumniRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.alumniRegistration.count({ where }),
  ])

  return NextResponse.json({
    items: items.map(serializeRegistration),
    total,
    page,
    pageSize,
  })
}
