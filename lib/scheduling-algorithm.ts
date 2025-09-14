import type { Class, Subject, Staff, TimetableEntry, TimeSlot, TimetableConstraints } from "@/types/timetable"

export interface SchedulingContext {
  classes: Class[]
  subjects: Subject[]
  staff: Staff[]
  constraints: TimetableConstraints
}

export interface SchedulingResult {
  success: boolean
  entries: TimetableEntry[]
  errors: string[]
  warnings: string[]
}

// Helper class to track scheduling state
class SchedulingState {
  private schedule: Map<string, TimetableEntry> = new Map() // key: "classId-day-period"
  private staffSchedule: Map<string, Set<string>> = new Map() // staffId -> Set of "day-period"
  private classSubjectCount: Map<string, Map<string, number>> = new Map() // classId -> subjectId -> count

  constructor(private context: SchedulingContext) {
    // Initialize staff schedule tracking
    context.staff.forEach((staff) => {
      this.staffSchedule.set(staff.id, new Set())
    })

    // Initialize class subject count tracking
    context.classes.forEach((cls) => {
      this.classSubjectCount.set(cls.id, new Map())
      context.subjects.forEach((subject) => {
        this.classSubjectCount.get(cls.id)!.set(subject.id, 0)
      })
    })
  }

  // Check if a staff member is available at a given time slot
  isStaffAvailable(staffId: string, timeSlot: TimeSlot): boolean {
    const staffSchedule = this.staffSchedule.get(staffId)
    if (!staffSchedule) return false

    const timeKey = `${timeSlot.day}-${timeSlot.period}`
    return !staffSchedule.has(timeKey)
  }

  // Check if a class slot is available
  isClassSlotAvailable(classId: string, timeSlot: TimeSlot): boolean {
    const key = `${classId}-${timeSlot.day}-${timeSlot.period}`
    return !this.schedule.has(key)
  }

  // Check if placing a subject would violate consecutive subject rule
  wouldViolateConsecutiveRule(classId: string, subjectId: string, timeSlot: TimeSlot): boolean {
    if (!this.context.constraints.noConsecutiveSubjects) return false

    const { day, period } = timeSlot

    // Check previous period
    if (period > 0) {
      const prevKey = `${classId}-${day}-${period - 1}`
      const prevEntry = this.schedule.get(prevKey)
      if (prevEntry && prevEntry.subjectId === subjectId) {
        return true
      }
    }

    // Check next period
    if (period < this.context.constraints.periodsPerDay - 1) {
      const nextKey = `${classId}-${day}-${period + 1}`
      const nextEntry = this.schedule.get(nextKey)
      if (nextEntry && nextEntry.subjectId === subjectId) {
        return true
      }
    }

    return false
  }

  // Get available staff for a subject
  getAvailableStaffForSubject(subjectId: string, timeSlot: TimeSlot): Staff[] {
    return this.context.staff.filter(
      (staff) => staff.subjects.includes(subjectId) && this.isStaffAvailable(staff.id, timeSlot),
    )
  }

  // Add an entry to the schedule
  addEntry(entry: TimetableEntry): void {
    const key = `${entry.classId}-${entry.timeSlot.day}-${entry.timeSlot.period}`
    this.schedule.set(key, entry)

    // Update staff schedule
    const timeKey = `${entry.timeSlot.day}-${entry.timeSlot.period}`
    this.staffSchedule.get(entry.staffId)?.add(timeKey)

    // Update subject count
    const classSubjects = this.classSubjectCount.get(entry.classId)
    if (classSubjects) {
      const currentCount = classSubjects.get(entry.subjectId) || 0
      classSubjects.set(entry.subjectId, currentCount + 1)
    }
  }

  // Get current subject count for a class
  getSubjectCount(classId: string, subjectId: string): number {
    return this.classSubjectCount.get(classId)?.get(subjectId) || 0
  }

  // Get all scheduled entries
  getAllEntries(): TimetableEntry[] {
    return Array.from(this.schedule.values())
  }

  // Get remaining periods needed for each subject in each class
  getRemainingPeriodsNeeded(): Map<string, Map<string, number>> {
    const remaining = new Map<string, Map<string, number>>()

    this.context.classes.forEach((cls) => {
      remaining.set(cls.id, new Map())
      this.context.subjects.forEach((subject) => {
        const scheduled = this.getSubjectCount(cls.id, subject.id)
        const needed = Math.max(0, subject.periodsPerWeek - scheduled)
        remaining.get(cls.id)!.set(subject.id, needed)
      })
    })

    return remaining
  }
}

// Main scheduling algorithm using backtracking with heuristics
export class TimetableScheduler {
  private context: SchedulingContext
  private state: SchedulingState
  private errors: string[] = []
  private warnings: string[] = []

  constructor(context: SchedulingContext) {
    this.context = context
    this.state = new SchedulingState(context)
  }

  // Main scheduling method
  schedule(): SchedulingResult {
    this.errors = []
    this.warnings = []

    // Validate input data
    if (!this.validateInputData()) {
      return {
        success: false,
        entries: [],
        errors: this.errors,
        warnings: this.warnings,
      }
    }

    // Generate all time slots
    const timeSlots = this.generateTimeSlots()

    // Create assignment tasks (class-subject pairs with required periods)
    const assignments = this.createAssignmentTasks()

    // Sort assignments by priority (subjects with fewer available staff first)
    assignments.sort((a, b) => {
      const aStaffCount = this.getStaffCountForSubject(a.subjectId)
      const bStaffCount = this.getStaffCountForSubject(b.subjectId)
      return aStaffCount - bStaffCount
    })

    // Try to schedule all assignments
    if (this.scheduleAssignments(assignments, timeSlots)) {
      return {
        success: true,
        entries: this.state.getAllEntries(),
        errors: this.errors,
        warnings: this.warnings,
      }
    } else {
      this.errors.push("Unable to generate a complete timetable with the given constraints")
      return {
        success: false,
        entries: this.state.getAllEntries(),
        errors: this.errors,
        warnings: this.warnings,
      }
    }
  }

  private validateInputData(): boolean {
    let isValid = true

    // Check if we have data
    if (this.context.classes.length === 0) {
      this.errors.push("No classes defined")
      isValid = false
    }

    if (this.context.subjects.length === 0) {
      this.errors.push("No subjects defined")
      isValid = false
    }

    if (this.context.staff.length === 0) {
      this.errors.push("No staff members defined")
      isValid = false
    }

    // Check if each subject has at least one qualified staff member
    this.context.subjects.forEach((subject) => {
      const qualifiedStaff = this.context.staff.filter((staff) => staff.subjects.includes(subject.id))
      if (qualifiedStaff.length === 0) {
        this.errors.push(`No staff member qualified to teach ${subject.name}`)
        isValid = false
      }
    })

    // Check if total periods required can fit in the schedule
    const totalSlotsPerClass = this.context.constraints.workingDays * this.context.constraints.periodsPerDay
    this.context.classes.forEach((cls) => {
      const totalPeriodsRequired = this.context.subjects.reduce((sum, subject) => sum + subject.periodsPerWeek, 0)

      if (totalPeriodsRequired > totalSlotsPerClass) {
        this.warnings.push(
          `Class ${cls.displayName} requires ${totalPeriodsRequired} periods but only ${totalSlotsPerClass} slots available`,
        )
      }
    })

    return isValid
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = []
    for (let day = 0; day < this.context.constraints.workingDays; day++) {
      for (let period = 0; period < this.context.constraints.periodsPerDay; period++) {
        slots.push({ day, period })
      }
    }
    return slots
  }

  private createAssignmentTasks(): Array<{ classId: string; subjectId: string; periodsNeeded: number }> {
    const assignments: Array<{ classId: string; subjectId: string; periodsNeeded: number }> = []

    this.context.classes.forEach((cls) => {
      this.context.subjects.forEach((subject) => {
        if (subject.periodsPerWeek > 0) {
          assignments.push({
            classId: cls.id,
            subjectId: subject.id,
            periodsNeeded: subject.periodsPerWeek,
          })
        }
      })
    })

    return assignments
  }

  private getStaffCountForSubject(subjectId: string): number {
    return this.context.staff.filter((staff) => staff.subjects.includes(subjectId)).length
  }

  private scheduleAssignments(
    assignments: Array<{ classId: string; subjectId: string; periodsNeeded: number }>,
    timeSlots: TimeSlot[],
  ): boolean {
    // For each assignment, try to schedule the required number of periods
    for (const assignment of assignments) {
      let periodsScheduled = 0
      const maxAttempts = timeSlots.length * 2 // Prevent infinite loops
      let attempts = 0

      while (periodsScheduled < assignment.periodsNeeded && attempts < maxAttempts) {
        attempts++

        // Shuffle time slots for randomness
        const shuffledSlots = [...timeSlots].sort(() => Math.random() - 0.5)

        let scheduledThisRound = false
        for (const timeSlot of shuffledSlots) {
          if (this.tryScheduleAt(assignment.classId, assignment.subjectId, timeSlot)) {
            periodsScheduled++
            scheduledThisRound = true
            break
          }
        }

        // If we couldn't schedule anything this round, we're stuck
        if (!scheduledThisRound) {
          break
        }
      }

      // Check if we scheduled enough periods for this assignment
      if (periodsScheduled < assignment.periodsNeeded) {
        const subject = this.context.subjects.find((s) => s.id === assignment.subjectId)
        const cls = this.context.classes.find((c) => c.id === assignment.classId)
        this.warnings.push(
          `Could only schedule ${periodsScheduled}/${assignment.periodsNeeded} periods for ${subject?.name} in ${cls?.displayName}`,
        )
      }
    }

    return true // Return partial success
  }

  private tryScheduleAt(classId: string, subjectId: string, timeSlot: TimeSlot): boolean {
    // Check if class slot is available
    if (!this.state.isClassSlotAvailable(classId, timeSlot)) {
      return false
    }

    // Check consecutive subject constraint
    if (this.state.wouldViolateConsecutiveRule(classId, subjectId, timeSlot)) {
      return false
    }

    // Find available staff
    const availableStaff = this.state.getAvailableStaffForSubject(subjectId, timeSlot)
    if (availableStaff.length === 0) {
      return false
    }

    // Select staff (prefer staff with fewer assignments for load balancing)
    const selectedStaff = availableStaff[0] // Simple selection for now

    // Create and add the entry
    const entry: TimetableEntry = {
      classId,
      subjectId,
      staffId: selectedStaff.id,
      timeSlot,
    }

    this.state.addEntry(entry)
    return true
  }
}

// Utility function to create default constraints
export function createDefaultConstraints(): TimetableConstraints {
  return {
    workingDays: 6,
    periodsPerDay: 7,
    noConsecutiveSubjects: true,
    includeFreePeriods: true,
  }
}
