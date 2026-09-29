// ──────────────────────────────────────────────────────────────
// Central configuration for the Alumni Registration form.
// Edit these lists to change dropdown / option content later —
// no component code needs to change.
// ──────────────────────────────────────────────────────────────

// Batch / passing-out years (2001 – 2022)
export const BATCH_YEARS: string[] = Array.from({ length: 2022 - 2001 + 1 }, (_, i) =>
  String(2022 - i),
)

// Branches offered at the college.
// Update this list to match your institution's departments.
export const BRANCHES: string[] = [
  "Computer Science & Engineering",
  "Information Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence & Machine Learning",
  "Data Science",
  "Biotechnology",
  "Chemical Engineering",
  "Master of Business Administration (MBA)",
  "Master of Computer Applications (MCA)",
  "M. Tech in Computer Science and Engineering",
  "M. Tech in Electronics and Communication Engineering",
  "M. Tech in Structural Engineering",
]

export const FOOD_PREFERENCES = [
  { value: "veg", label: "Vegetarian", emoji: "🥗", hint: "Pure veg meals" },
  { value: "non-veg", label: "Non-Vegetarian", emoji: "🍽️", hint: "Includes non-veg options" },
] as const

export const ATTENDANCE_OPTIONS = [
  {
    value: "yes",
    title: "Yes, I'm attending",
    description: "Count me in for the celebration!",
    emoji: "🎉",
  },
  {
    value: "no",
    title: "No, I can't attend",
    description: "I'd still love to stay connected.",
    emoji: "💛",
  },
] as const

export const PEOPLE_OPTIONS = ["1", "2", "3", "4", "5", "Other"] as const

export const ALUMNI_BENEFITS: { icon: string; title: string; text: string }[] = [
  { icon: "users", title: "Stay Connected", text: "Remain part of your college community for life." },
  { icon: "heart", title: "Reconnect", text: "Meet old friends and favourite faculty again." },
  { icon: "calendar", title: "Exclusive Events", text: "Get invited to reunions, talks and celebrations." },
  { icon: "briefcase", title: "Grow Your Network", text: "Build professional and personal connections." },
  { icon: "bell", title: "Stay Updated", text: "Be the first to hear about college initiatives." },
]

export const COLLEGE_SHORT = "SVCE"
