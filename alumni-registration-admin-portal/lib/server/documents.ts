import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resvg } from "@resvg/resvg-js"
import QRCode from "qrcode"

const STORAGE_SUBDIR = process.env.DOCUMENT_STORAGE_DIR || "documents"
const PUBLIC_APP_URL = process.env.ADMIN_PUBLIC_APP_URL || "http://localhost:3001"

type CardInput = {
  alumniId: string
  name: string
  batchYear: number
  branch: string
  usn: string | null
  photoUrl: string | null
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    }
    return entities[character]
  })
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

async function fetchPhotoDataUri(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl) return null
  try {
    const response = await fetch(photoUrl)
    if (!response.ok) return null
    const contentType = response.headers.get("content-type") || "image/jpeg"
    const buffer = Buffer.from(await response.arrayBuffer())
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

async function qrDataUri(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 200 })
}

function renderPng(svg: string): Buffer {
  const resvg = new Resvg(svg, { fitTo: { mode: "original" } })
  return resvg.render().asPng()
}

async function ensureDir() {
  const dir = path.join(process.cwd(), "public", STORAGE_SUBDIR)
  await mkdir(dir, { recursive: true })
  return dir
}

async function saveDocument(buffer: Buffer, filename: string) {
  const dir = await ensureDir()
  await writeFile(path.join(dir, filename), buffer)
  const documentPath = `${STORAGE_SUBDIR}/${filename}`
  const documentUrl = `${PUBLIC_APP_URL.replace(/\/$/, "")}/${documentPath}`
  return { documentPath, documentUrl }
}

export async function generateMembershipCard(input: CardInput) {
  const [photoDataUri, qrCode] = await Promise.all([
    fetchPhotoDataUri(input.photoUrl),
    qrDataUri(input.alumniId),
  ])

  const name = escapeXml(input.name)
  const usn = escapeXml(input.usn ?? "—")
  const branch = escapeXml(input.branch)

  const photoMarkup = photoDataUri
    ? `<clipPath id="photoClip"><circle cx="135" cy="320" r="71" /></clipPath><image href="${photoDataUri}" x="64" y="249" width="142" height="142" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice" />`
    : `<circle cx="135" cy="320" r="71" fill="#eaf3f7"/><text x="135" y="337" text-anchor="middle" fill="#087fae" font-size="48" font-weight="700">${escapeXml(initialsOf(input.name))}</text>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1011" height="638" viewBox="0 0 1011 638" role="img" aria-label="SVCE Alumni Membership Card for ${name}">
    <title>SVCE Alumni Membership Card - ${name}</title>
    <rect width="1011" height="638" rx="36" fill="#101a2d"/>
    <path d="M36 0h939a36 36 0 0 1 36 36v168H0V36A36 36 0 0 1 36 0" fill="#087fae"/>
    <text x="64" y="78" fill="#fff" font-size="24" font-weight="700" letter-spacing="2">SVCE BENGALURU</text>
    <text x="64" y="125" fill="#d8edf4" font-size="18">ALUMNI MEMBERSHIP CARD · 25TH SILVER JUBILEE</text>
    ${photoMarkup}
    <text x="246" y="284" fill="#fff" font-size="35" font-weight="700">${name}</text>
    <text x="246" y="330" fill="#d8edf4" font-size="21">Alumni ID  ${escapeXml(input.alumniId)}</text>
    <text x="246" y="374" fill="#d8edf4" font-size="21">USN  ${usn}  ·  Batch  ${input.batchYear}</text>
    <text x="246" y="418" fill="#d8edf4" font-size="21">Branch  ${branch}</text>
    <path d="M64 506h743" stroke="#2c3b50" stroke-width="2"/>
    <text x="64" y="562" fill="#39b6ee" font-size="18" font-weight="700" letter-spacing="1">SILVER JUBILEE · 25 YEARS</text>
    <text x="64" y="596" fill="#8ea0b4" font-size="15">Valid for alumni identification</text>
    <image href="${qrCode}" x="855" y="480" width="100" height="100" />
  </svg>`

  const buffer = renderPng(svg)
  return saveDocument(buffer, `${input.alumniId}-membership-card.png`)
}

export async function generateEntryPass(input: CardInput) {
  const qrCode = await qrDataUri(input.alumniId)
  const name = escapeXml(input.name)
  const usn = escapeXml(input.usn ?? "—")
  const branch = escapeXml(input.branch)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="360" viewBox="0 0 1000 360" role="img" aria-label="SVCE Event Entry Pass for ${name}">
    <title>SVCE Event Entry Pass - ${name}</title>
    <rect width="1000" height="360" rx="28" fill="#101a2d"/>
    <rect x="24" y="24" width="952" height="312" rx="18" fill="#fff"/>
    <path d="M690 24h268a18 18 0 0 1 18 18v276a18 18 0 0 1-18 18H690z" fill="#eaf3f7"/>
    <text x="64" y="86" fill="#176b87" font-size="25" font-weight="700" letter-spacing="2">SVCE / SILVER JUBILEE</text>
    <text x="64" y="145" fill="#172b3a" font-size="38" font-weight="700">${name}</text>
    <text x="64" y="188" fill="#5c6c79" font-size="21">USN ${usn} · Batch ${input.batchYear} · ${branch}</text>
    <text x="64" y="230" fill="#5c6c79" font-size="18">Alumni ID ${escapeXml(input.alumniId)}</text>
    <text x="64" y="275" fill="#172b3a" font-size="18" font-weight="700">ALUMNI REUNION · 25TH SILVER JUBILEE</text>
    <text x="728" y="120" fill="#176b87" font-size="22" font-weight="700" letter-spacing="2">ENTRY PASS</text>
    <text x="728" y="160" fill="#172b3a" font-size="26" font-weight="700">ADMIT ONE</text>
    <image href="${qrCode}" x="728" y="180" width="110" height="110" />
  </svg>`

  const buffer = renderPng(svg)
  return saveDocument(buffer, `${input.alumniId}-entry-pass.png`)
}

export async function readDocumentBuffer(documentPath: string): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "public", documentPath))
}
