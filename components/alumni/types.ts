// Shape of the registration data held in frontend state.
// Structured so a backend API can consume it directly later.
export type FormData = {
  name: string
  year: string
  branch: string
  usn: string
  attending: "yes" | "no" | ""
  peopleCount: string // "1".."5" or "Other"
  peopleOther: string // custom count when "Other" is chosen
  food: "veg" | "non-veg" | ""
  phone: string
  email: string
  photo: File | null
  linkedinUrl: string
  company: string
  position: string
  awards: string
  experience: string
}

export const INITIAL_FORM_DATA: FormData = {
  name: "",
  year: "",
  branch: "",
  usn: "",
  attending: "",
  peopleCount: "",
  peopleOther: "",
  food: "",
  phone: "",
  email: "",
  photo: null,
  linkedinUrl: "",
  company: "",
  position: "",
  awards: "",
  experience: "",
}

export type Errors = Partial<Record<keyof FormData, string>>
