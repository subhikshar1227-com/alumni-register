import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { Resvg } from "@resvg/resvg-js"
import QRCode from "qrcode"

const STORAGE_SUBDIR = process.env.DOCUMENT_STORAGE_DIR || "documents"
const PUBLIC_APP_URL = process.env.ADMIN_PUBLIC_APP_URL || "http://localhost:3001"

// Membership Card QR — opens the official college website (verification /
// "learn more" link), not the Alumni ID.
const SVCE_WEBSITE_URL = "https://svcengg.edu.in/"

// Both provided template images are 1536x1024 — the SVG canvas below uses
// that exact size so template coordinates map 1:1 to SVG coordinates.
const TEMPLATE_WIDTH = 1536
const TEMPLATE_HEIGHT = 1024

type CardInput = {
  alumniId: string
  name: string
  batchYear: number
  branch: string
  usn: string | null
  phone: string
  photoUrl: string | null
  company: string | null
  position: string | null
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

async function readImageDataUri(filePath: string): Promise<string | null> {
  try {
    const extension = path.extname(filePath).toLowerCase()
    const contentType = extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg"
    const buffer = await readFile(filePath)
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

async function qrDataUri(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 400 })
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

function fieldOrDash(value: string | null | undefined) {
  const trimmed = (value ?? "").trim()
  return trimmed ? escapeXml(trimmed) : "—"
}

// ──────────────────────────────────────────────────────────────
// Alumni Card — the provided template image (public/templates/
// alumni-card-template.jpg) is the actual visual design. This function
// only overlays dynamic data (photo, QR, text) on top of it; the template
// itself is never redrawn or redesigned.
// ──────────────────────────────────────────────────────────────
export async function generateMembershipCard(input: CardInput) {
  const [templateDataUri, photoDataUri, qrCode] = await Promise.all([
    readImageDataUri(path.join(process.cwd(), "public", "templates", "alumni-card-template.jpg")),
    fetchPhotoDataUri(input.photoUrl),
    qrDataUri(SVCE_WEBSITE_URL),
  ])

  const name = escapeXml(input.name)
  const alumniId = escapeXml(input.alumniId)
  const usn = fieldOrDash(input.usn)
  const branch = escapeXml(input.branch)
  const role = fieldOrDash(input.position)
  const company = fieldOrDash(input.company)

  // Photo placeholder box — the INNER white area inside the gold frame,
  // measured precisely against the 1536x1024 template (not the frame
  // itself), so the photo sits flush inside the border instead of
  // overlapping it.
  const photoBox = { x: 63, y: 410, width: 247, height: 300 }
  const photoMarkup = photoDataUri
    ? `<image href="${photoDataUri}" x="${photoBox.x}" y="${photoBox.y}" width="${photoBox.width}" height="${photoBox.height}" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice" />`
    : ""

  // QR placeholder box — opens the SVCE website when scanned (verification
  // link), fully covering the template's static QR artwork.
  const qrBox = { x: 1300, y: 592, width: 178, height: 124 }

  // The template's own labels ("Alumni Name :", "Branch :", etc.) are
  // already printed correctly — only the value after each colon is
  // placeholder text ("Your Name Here", "SVCEALUM123", ...) baked into the
  // template image, so each row gets a cover rect (matching the panel's
  // cream background) plus the real value drawn on top of it.
  const CARD_PANEL_BG = "#f8f6f0"
  const valueX = 674
  const values = [name, alumniId, usn, branch, String(input.batchYear), role, company]
  const rowStartY = 595
  const rowSpacing = 38
  const rowsMarkup = values
    .map(
      (value, index) => `
      <rect x="660" y="${rowStartY + index * rowSpacing - 28}" width="360" height="${index === values.length - 1 ? 60 : 40}" fill="${CARD_PANEL_BG}" />
      <text x="${valueX}" y="${rowStartY + index * rowSpacing}" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#1e3a6e">${value}</text>`,
    )
    .join("")

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TEMPLATE_WIDTH}" height="${TEMPLATE_HEIGHT}" viewBox="0 0 ${TEMPLATE_WIDTH} ${TEMPLATE_HEIGHT}" role="img" aria-label="SVCE Alumni Card for ${name}">
    <title>SVCE Alumni Card - ${name}</title>
    <defs>
      <clipPath id="photoClip"><rect x="${photoBox.x}" y="${photoBox.y}" width="${photoBox.width}" height="${photoBox.height}" rx="10" /></clipPath>
    </defs>
    ${templateDataUri ? `<image href="${templateDataUri}" x="0" y="0" width="${TEMPLATE_WIDTH}" height="${TEMPLATE_HEIGHT}" preserveAspectRatio="none" />` : `<rect width="${TEMPLATE_WIDTH}" height="${TEMPLATE_HEIGHT}" fill="#0c1d3d"/>`}
    ${photoMarkup}
    ${rowsMarkup}
    <image href="${qrCode}" x="${qrBox.x}" y="${qrBox.y}" width="${qrBox.width}" height="${qrBox.height}" />
  </svg>`

  const buffer = renderPng(svg)
  return saveDocument(buffer, `${input.alumniId}-membership-card.png`)
}

// ──────────────────────────────────────────────────────────────
// Entry Pass — same approach: public/templates/entry-pass-template.jpg is
// the actual visual design, only the dynamic fields are overlaid.
// ──────────────────────────────────────────────────────────────
export async function generateEntryPass(input: CardInput) {
  // Scanning this QR at the gate opens the coordinator check-in page for
  // this Alumni ID (shows how many people are expected, lets them confirm
  // arrival) — see app/checkin/[alumniId] and app/api/checkin/[alumniId].
  const checkinUrl = `${PUBLIC_APP_URL.replace(/\/$/, "")}/checkin/${encodeURIComponent(input.alumniId)}`

  const [templateDataUri, photoDataUri, qrCode] = await Promise.all([
    readImageDataUri(path.join(process.cwd(), "public", "templates", "entry-pass-template.jpg")),
    fetchPhotoDataUri(input.photoUrl),
    qrDataUri(checkinUrl),
  ])

  const name = escapeXml(input.name)
  const nameUpper = escapeXml(input.name.toUpperCase())
  const alumniId = escapeXml(input.alumniId)
  const phone = escapeXml(input.phone ? `+91 ${input.phone}` : "—")

  // Inner white area inside the gold frame, measured precisely against the
  // 1536x1024 template so the photo sits flush inside the border.
  const photoBox = { x: 58, y: 473, width: 234, height: 228 }
  const photoMarkup = photoDataUri
    ? `<image href="${photoDataUri}" x="${photoBox.x}" y="${photoBox.y}" width="${photoBox.width}" height="${photoBox.height}" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice" />`
    : ""

  const qrBox = { x: 1225, y: 442, width: 255, height: 243 }

  // "ALUMNI NAME" and "BRANCH | GRADUATION YEAR" are themselves placeholder
  // text baked into the template (not static labels), so those two lines
  // get a full-width cover rect. "Alumni ID :" / "Contact No. :" are real
  // static labels — only their value needs covering + replacing, same
  // approach as the Alumni Card.
  const PASS_PANEL_BG = "#101a2d"

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TEMPLATE_WIDTH}" height="${TEMPLATE_HEIGHT}" viewBox="0 0 ${TEMPLATE_WIDTH} ${TEMPLATE_HEIGHT}" role="img" aria-label="SVCE Event Entry Pass for ${name}">
    <title>SVCE Event Entry Pass - ${name}</title>
    <defs>
      <clipPath id="photoClip"><rect x="${photoBox.x}" y="${photoBox.y}" width="${photoBox.width}" height="${photoBox.height}" rx="10" /></clipPath>
    </defs>
    ${templateDataUri ? `<image href="${templateDataUri}" x="0" y="0" width="${TEMPLATE_WIDTH}" height="${TEMPLATE_HEIGHT}" preserveAspectRatio="none" />` : `<rect width="${TEMPLATE_WIDTH}" height="${TEMPLATE_HEIGHT}" fill="${PASS_PANEL_BG}"/>`}
    ${photoMarkup}
    <rect x="476" y="552" width="710" height="60" fill="${PASS_PANEL_BG}" />
    <text x="480" y="600" font-family="Arial, sans-serif" font-size="46" font-weight="700" letter-spacing="1" fill="#f3cf72">${nameUpper}</text>
    <rect x="476" y="600" width="710" height="42" fill="${PASS_PANEL_BG}" />
    <text x="480" y="632" font-family="Arial, sans-serif" font-size="21" letter-spacing="2" fill="#e8ecf3">${escapeXml(input.branch.toUpperCase())} | ${input.batchYear}</text>
    <rect x="700" y="660" width="330" height="32" fill="${PASS_PANEL_BG}" />
    <text x="710" y="685" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#ffffff">${alumniId}</text>
    <rect x="700" y="697" width="330" height="32" fill="${PASS_PANEL_BG}" />
    <text x="710" y="722" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#ffffff">${phone}</text>
    <image href="${qrCode}" x="${qrBox.x}" y="${qrBox.y}" width="${qrBox.width}" height="${qrBox.height}" />
  </svg>`

  const buffer = renderPng(svg)
  return saveDocument(buffer, `${input.alumniId}-entry-pass.png`)
}

export async function readDocumentBuffer(documentPath: string): Promise<Buffer> {
  return readFile(path.join(process.cwd(), "public", documentPath))
}
