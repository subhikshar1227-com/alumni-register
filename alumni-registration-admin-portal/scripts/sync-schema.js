// Copies the alumni_2026 app's prisma/schema.prisma into this app's own
// prisma/ directory so there is only ONE file you ever hand-edit — this
// app's copy is a build artifact, regenerated every time dev/build/
// db:generate runs here (see package.json). The two apps still need their
// own copy on disk (separate Next.js projects, separate node_modules /
// Prisma clients, per the file's own header comment), but this keeps them
// permanently in sync with zero manual copying and zero risk of drift.
const fs = require("node:fs")
const path = require("node:path")

const source = path.join(__dirname, "..", "..", "prisma", "schema.prisma")
const destination = path.join(__dirname, "..", "prisma", "schema.prisma")

fs.copyFileSync(source, destination)
console.log(`Synced prisma/schema.prisma from ${source}`)
