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
  phone?: string
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
  const [photoDataUri, qrCode, logoDataUri, campusDataUri] = await Promise.all([
    fetchPhotoDataUri(input.photoUrl),
    qrDataUri(input.alumniId),
    readImageDataUri(path.join(process.cwd(), "logo.png")),
    readImageDataUri(path.join(process.cwd(), "public", "campus.jpg")),
  ])

  const name = escapeXml(input.name)
  const usn = escapeXml(input.usn ?? "")
  const branch = escapeXml(input.branch)
  const phone = escapeXml(input.phone ? `+91 ${input.phone}` : "")

  const photoMarkup = photoDataUri
    ? `<image href="${photoDataUri}" x="60" y="280" width="140" height="140" clip-path="url(#portraitClip)" preserveAspectRatio="xMidYMid slice" />`
    : `<circle cx="130" cy="350" r="70" fill="#f8f6f0"/><text x="130" y="365" text-anchor="middle" fill="#1a365d" font-size="36" font-weight="700">${escapeXml(initialsOf(input.name))}</text>`

  const campusMarkup = campusDataUri
    ? `<image href="${campusDataUri}" x="230" y="150" width="570" height="250" clip-path="url(#campusClip)" preserveAspectRatio="xMidYMid slice" />`
    : `<rect x="230" y="150" width="570" height="250" fill="#1a365d"/><text x="515" y="275" text-anchor="middle" fill="#d4af37" font-family="serif" font-size="24" letter-spacing="2">SVCE CAMPUS</text>`

  const logoMarkup = logoDataUri
    ? `<image href="${logoDataUri}" x="40" y="25" width="80" height="90" preserveAspectRatio="xMidYMid meet" />`
    : `<circle cx="80" cy="70" r="40" fill="#d4af37"/><text x="80" y="80" text-anchor="middle" fill="#1a365d" font-size="20" font-weight="700">SVCE</text>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 1024 640" role="img" aria-label="SVCE Alumni Card for ${name}">
    <title>SVCE Alumni Card - ${name}</title>
    <defs>
      <clipPath id="cardClip"><rect width="1024" height="640" rx="24"/></clipPath>
      <clipPath id="portraitClip"><rect x="60" y="280" width="140" height="140" rx="12"/></clipPath>
      <clipPath id="campusClip"><path d="M230 150h570v200c0 27.614-22.386 50-50 50H280c-27.614 0-50-22.386-50-50V150z"/></clipPath>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#1a365d;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#2c5282;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f6e05e;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#d4af37;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#b7791f;stop-opacity:1" />
      </linearGradient>
      <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#e2e8f0;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#cbd5e0;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#a0aec0;stop-opacity:1" />
      </linearGradient>
    </defs>
    <g clip-path="url(#cardClip)">
      <!-- Card Background -->
      <rect width="1024" height="640" fill="#f8f6f0"/>
      
      <!-- Header Section -->
      <rect width="1024" height="150" fill="url(#headerGrad)"/>
      
      <!-- Logo -->
      ${logoMarkup}
      
      <!-- College Name -->
      <text x="140" y="50" fill="#ffffff" font-size="32" font-weight="700" letter-spacing="1">SRI VENKATESHWARA</text>
      <text x="140" y="80" fill="#ffffff" font-size="32" font-weight="700" letter-spacing="1">COLLEGE OF ENGINEERING</text>
      <text x="140" y="105" fill="#cbd5e0" font-size="16" letter-spacing="2">BENGALURU</text>
      <text x="140" y="125" fill="#a0aec0" font-size="12" letter-spacing="1">KNOWLEDGE • INNOVATION • A BETTER TOMORROW</text>
      
      <!-- Silver Jubilee Badge -->
      <circle cx="870" cy="75" r="60" fill="url(#goldGrad)" stroke="#b7791f" stroke-width="3"/>
      <path d="M830,45 Q830,35 840,35 L900,35 Q910,35 910,45 L910,105 Q910,115 900,115 L840,115 Q830,115 830,105 Z" fill="none" stroke="#b7791f" stroke-width="2"/>
      <text x="870" y="60" text-anchor="middle" fill="#1a365d" font-family="serif" font-size="48" font-weight="700">25</text>
      <text x="870" y="75" text-anchor="middle" fill="#1a365d" font-size="10" letter-spacing="1">th</text>
      <text x="870" y="90" text-anchor="middle" fill="#1a365d" font-family="serif" font-size="14" font-style="italic">Silver Jubilee</text>
      <text x="870" y="108" text-anchor="middle" fill="#1a365d" font-size="10" letter-spacing="1">2001 - 2026</text>
      
      <!-- Decorative Elements -->
      <path d="M10,130 Q200,140 500,135 T1014,130" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
      
      <!-- Campus Image Section -->
      ${campusMarkup}
      
      <!-- Curved Transition -->
      <path d="M230 400 Q400 380 600 385 T1024 390 V640 H230 Z" fill="#f8f6f0"/>
      <path d="M230 395 Q400 375 600 380 T1024 385" fill="none" stroke="url(#goldGrad)" stroke-width="3"/>
      
      <!-- Alumni Card Title Banner -->
      <rect x="320" y="340" width="460" height="50" rx="25" fill="#1a365d"/>
      <rect x="325" y="345" width="450" height="40" rx="20" fill="url(#goldGrad)"/>
      <text x="550" y="370" text-anchor="middle" fill="#1a365d" font-size="24" font-weight="700" letter-spacing="2">♦ SVCE ALUMNI CARD ♦</text>
      
      <!-- Alumni Photo -->
      <rect x="55" y="275" width="150" height="150" rx="12" fill="url(#goldGrad)" stroke="#b7791f" stroke-width="3"/>
      <rect x="60" y="280" width="140" height="140" rx="8" fill="#ffffff"/>
      ${photoMarkup}
      
      <!-- Alumni Information Section -->
      <text x="250" y="460" fill="#1a365d" font-size="14" font-weight="700">Alumni Name</text>
      <text x="380" y="460" fill="#2d3748" font-size="18" font-weight="600" textLength="420" lengthAdjust="spacingAndGlyphs">${name}</text>
      
      <text x="250" y="485" fill="#1a365d" font-size="14" font-weight="700">Alumni ID</text>
      <text x="380" y="485" fill="#2d3748" font-size="16" font-weight="600">${escapeXml(input.alumniId)}</text>
      
      ${usn ? `<text x="250" y="510" fill="#1a365d" font-size="14" font-weight="700">USN (Optional)</text>
      <text x="380" y="510" fill="#2d3748" font-size="16" font-weight="600">${usn}</text>` : ''}
      
      <text x="250" y="${usn ? '535' : '510'}" fill="#1a365d" font-size="14" font-weight="700">Branch</text>
      <text x="380" y="${usn ? '535' : '510'}" fill="#2d3748" font-size="16" textLength="420" lengthAdjust="spacingAndGlyphs">${branch}</text>
      
      <text x="250" y="${usn ? '560' : '535'}" fill="#1a365d" font-size="14" font-weight="700">Year of Graduation</text>
      <text x="380" y="${usn ? '560' : '535'}" fill="#2d3748" font-size="16" font-weight="600">${input.batchYear}</text>
      
      ${phone ? `<text x="250" y="${usn ? '585' : '560'}" fill="#1a365d" font-size="14" font-weight="700">Contact Number</text>
      <text x="380" y="${usn ? '585' : '560'}" fill="#2d3748" font-size="16" font-weight="600">${phone}</text>` : ''}
      
      <!-- QR Code Section -->
      <rect x="830" y="430" width="150" height="150" rx="12" fill="#ffffff" stroke="url(#goldGrad)" stroke-width="3"/>
      <image href="${qrCode}" x="845" y="445" width="120" height="120" />
      <text x="905" y="600" text-anchor="middle" fill="#1a365d" font-size="11" font-weight="700" letter-spacing="1">SCAN FOR VERIFICATION</text>
      
      <!-- Tagline -->
      <text x="130" y="490" text-anchor="middle" fill="#d4af37" font-family="serif" font-size="14" font-style="italic" transform="rotate(-90 130 490)">Once an SVCEian,</text>
      <text x="130" y="520" text-anchor="middle" fill="#d4af37" font-family="serif" font-size="14" font-style="italic" transform="rotate(-90 130 520)">Always an SVCEian</text>
      <path d="M110,460 L110,540" stroke="url(#goldGrad)" stroke-width="2"/>
      
      <!-- Footer -->
      <rect x="0" y="590" width="1024" height="50" fill="url(#headerGrad)"/>
      <text x="80" y="610" fill="#d4af37" font-size="12" font-weight="700">LIFELONG</text>
      <text x="80" y="625" fill="#cbd5e0" font-size="10">CONNECTIONS</text>
      
      <text x="280" y="610" fill="#d4af37" font-size="12" font-weight="700">LEARNING BEYOND</text>
      <text x="280" y="625" fill="#cbd5e0" font-size="10">CLASSROOMS</text>
      
      <text x="520" y="610" fill="#d4af37" font-size="12" font-weight="700">NETWORK</text>
      <text x="520" y="625" fill="#cbd5e0" font-size="10">FOR GROWTH</text>
      
      <text x="720" y="610" fill="#d4af37" font-size="12" font-weight="700">CONTRIBUTE TO A</text>
      <text x="720" y="625" fill="#cbd5e0" font-size="10">BRIGHTER TOMORROW</text>
      
      <!-- Card Border -->
      <rect x="4" y="4" width="1016" height="632" rx="20" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
    </g>
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
