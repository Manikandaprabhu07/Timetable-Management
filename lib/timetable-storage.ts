// Local storage utilities for timetable data
import type { GeneratedTimetable, Class, Subject, Staff } from "@/types/timetable"

const STORAGE_KEYS = {
  CLASSES: "timetable_classes",
  SUBJECTS: "timetable_subjects",
  STAFF: "timetable_staff",
  TIMETABLES: "timetable_generated",
} as const

export const storage = {
  // Classes
  getClasses: (): Class[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.CLASSES)
    return data ? JSON.parse(data) : []
  },

  saveClasses: (classes: Class[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes))
  },

  // Subjects
  getSubjects: (): Subject[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS)
    return data ? JSON.parse(data) : []
  },

  saveSubjects: (subjects: Subject[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects))
  },

  // Staff
  getStaff: (): Staff[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.STAFF)
    return data ? JSON.parse(data) : []
  },

  saveStaff: (staff: Staff[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff))
  },

  // Generated Timetables
  getTimetables: (): GeneratedTimetable[] => {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.TIMETABLES)
    return data
      ? JSON.parse(data).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
        }))
      : []
  },

  saveTimetable: (timetable: GeneratedTimetable) => {
    if (typeof window === "undefined") return
    const existing = storage.getTimetables()
    const updated = [...existing.filter((t) => t.id !== timetable.id), timetable]
    localStorage.setItem(STORAGE_KEYS.TIMETABLES, JSON.stringify(updated))
  },

  deleteTimetable: (id: string) => {
    if (typeof window === "undefined") return
    const existing = storage.getTimetables()
    const updated = existing.filter((t) => t.id !== id)
    localStorage.setItem(STORAGE_KEYS.TIMETABLES, JSON.stringify(updated))
  },

  clearAll: () => {
    if (typeof window === "undefined") return
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
  },
}
