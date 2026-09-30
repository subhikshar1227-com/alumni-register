import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeEmailLog } from "@/lib/server/registrations"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })

  const logs = await prisma.emailLog.findMany({
    where: { registrationId: id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ items: logs.map(serializeEmailLog) })
}
