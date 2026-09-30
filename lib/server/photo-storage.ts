import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const STORAGE_SUBDIR = process.env.PHOTO_STORAGE_DIR || "uploads/photos"
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || "http://localhost:3000"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_BYTES = 5 * 1024 * 1024

export async function savePhoto(file: File): Promise<{ photoPath: string; photoUrl: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Photo must be a JPG, PNG or WEBP image.")
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be 5 MB or smaller.")
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const filename = `${randomUUID()}.${extension}`

  const dir = path.join(process.cwd(), "public", STORAGE_SUBDIR)
  await mkdir(dir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, filename), buffer)

  const photoPath = `${STORAGE_SUBDIR}/${filename}`
  const photoUrl = `${PUBLIC_APP_URL.replace(/\/$/, "")}/${photoPath}`
  return { photoPath, photoUrl }
}
