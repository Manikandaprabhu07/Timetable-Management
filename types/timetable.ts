// Core data types for the timetable management system
export interface Class {
  id: string
  name: string
  section: string
  displayName: string // e.g., "10th A", "11th Science"
}

export interface Subject {
  id: string
  name: string
  periodsPerWeek: number
  assignedClasses?: string[] // Array of class IDs that should take this subject
}

export interface Staff {
  id: string
  name: string
  email?: string
  subjects: string[] // Array of subject IDs they can teach
}

export interface TimeSlot {
  day: number // 0-5 (Monday to Saturday)
  period: number // 0-6 (7 periods per day)
}

export interface TimetableEntry {
  classId: string
  subjectId: string
  staffId: string
  timeSlot: TimeSlot
}

export interface GeneratedTimetable {
  id: string
  name: string
  classes: Class[]
  subjects: Subject[]
  staff: Staff[]
  entries: TimetableEntry[]
  createdAt: Date
}

export interface TimetableConstraints {
  workingDays: number // Default: 6
  periodsPerDay: number // Default: 7
  noConsecutiveSubjects: boolean // Default: true
  includeFreePeriods: boolean // Default: true
}

// Display types for generated timetables
export interface ClassTimetable {
  classId: string
  className: string
  schedule: (TimetableEntry | null)[][] // [day][period]
}

export interface StaffTimetable {
  staffId: string
  staffName: string
  schedule: (TimetableEntry | null)[][] // [day][period]
}
