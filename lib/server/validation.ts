import { z } from "zod"
import { BATCH_YEARS, BRANCHES } from "@/lib/config"

const VALID_YEARS = new Set(BATCH_YEARS.map(Number))
const VALID_BRANCHES = new Set(BRANCHES)

function isValidIndianPhone(phone: string) {
  return /^[6-9]\d{9}$/.test(phone)
}

export const registrationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    year: z.coerce
      .number()
      .int()
      .refine((value) => VALID_YEARS.has(value), "Enter a valid batch year."),
    branch: z.string().refine((value) => VALID_BRANCHES.has(value), "Enter a valid branch."),
    usn: z.string().trim().optional().default(""),
    attending: z.enum(["yes", "no"], { message: "Attendance is required." }),
    peopleCount: z.coerce.number().int().min(1).max(50).optional(),
    food: z.enum(["veg", "non-veg"]).optional(),
    phone: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .refine(isValidIndianPhone, "Enter a valid 10-digit Indian mobile number."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    company: z.string().trim().min(1, "Current company / organisation is required."),
    position: z.string().trim().optional().default(""),
    awards: z.string().trim().optional().default(""),
    experience: z.string().trim().optional().default(""),
    linkedinUrl: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.attending === "yes") {
      if (!data.peopleCount) {
        ctx.addIssue({ code: "custom", path: ["peopleCount"], message: "Number of accompanying people is required when attending." })
      }
      if (!data.food) {
        ctx.addIssue({ code: "custom", path: ["food"], message: "Food preference is required when attending." })
      }
    }
  })

export type RegistrationInput = z.infer<typeof registrationSchema>
