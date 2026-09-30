import { NextResponse } from "next/server"
import { prisma } from "@/lib/server/db"
import { serializeRegistration } from "@/lib/server/registrations"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const registration = await prisma.alumniRegistration.findUnique({ where: { id } })
  if (!registration) return NextResponse.json({ error: "Registration not found." }, { status: 404 })
  return NextResponse.json(serializeRegistration(registration))
}
