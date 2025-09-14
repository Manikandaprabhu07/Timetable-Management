import type {
  Class,
  Subject,
  Staff,
  GeneratedTimetable,
  TimetableConstraints,
  ClassTimetable,
  StaffTimetable,
  TimetableEntry,
} from "@/types/timetable"
import { TimetableScheduler, type SchedulingContext, createDefaultConstraints } from "./scheduling-algorithm"

export interface GenerationOptions {
  name: string
  constraints?: Partial<TimetableConstraints>
}

export interface GenerationResult {
  success: boolean
  timetable?: GeneratedTimetable
  classTimetables?: ClassTimetable[]
  staffTimetables?: StaffTimetable[]
  errors: string[]
  warnings: string[]
}

export class TimetableGenerator {
  static generate(classes: Class[], subjects: Subject[], staff: Staff[], options: GenerationOptions): GenerationResult {
    // Merge constraints with defaults
    const constraints: TimetableConstraints = {
      ...createDefaultConstraints(),
      ...options.constraints,
    }

    // Create scheduling context
    const context: SchedulingContext = {
      classes,
      subjects,
      staff,
      constraints,
    }

    // Run the scheduling algorithm
    const scheduler = new TimetableScheduler(context)
    const result = scheduler.schedule()

    if (!result.success) {
      return {
        success: false,
        errors: result.errors,
        warnings: result.warnings,
      }
    }

    // Create the generated timetable
    const timetable: GeneratedTimetable = {
      id: Date.now().toString(),
      name: options.name,
      classes: [...classes],
      subjects: [...subjects],
      staff: [...staff],
      entries: result.entries,
      createdAt: new Date(),
    }

    // Generate class and staff timetables
    const classTimetables = this.generateClassTimetables(timetable)
    const staffTimetables = this.generateStaffTimetables(timetable)

    return {
      success: true,
      timetable,
      classTimetables,
      staffTimetables,
      errors: result.errors,
      warnings: result.warnings,
    }
  }

  private static generateClassTimetables(timetable: GeneratedTimetable): ClassTimetable[] {
    const classTimetables: ClassTimetable[] = []

    timetable.classes.forEach((cls) => {
      // Initialize empty schedule grid
      const schedule: (TimetableEntry | null)[][] = []
      for (let day = 0; day < 6; day++) {
        schedule[day] = []
        for (let period = 0; period < 7; period++) {
          schedule[day][period] = null
        }
      }

      // Fill in the scheduled entries
      timetable.entries
        .filter((entry) => entry.classId === cls.id)
        .forEach((entry) => {
          schedule[entry.timeSlot.day][entry.timeSlot.period] = entry
        })

      classTimetables.push({
        classId: cls.id,
        className: cls.displayName,
        schedule,
      })
    })

    return classTimetables
  }

  private static generateStaffTimetables(timetable: GeneratedTimetable): StaffTimetable[] {
    const staffTimetables: StaffTimetable[] = []

    timetable.staff.forEach((staff) => {
      // Initialize empty schedule grid
      const schedule: (TimetableEntry | null)[][] = []
      for (let day = 0; day < 6; day++) {
        schedule[day] = []
        for (let period = 0; period < 7; period++) {
          schedule[day][period] = null
        }
      }

      // Fill in the scheduled entries
      timetable.entries
        .filter((entry) => entry.staffId === staff.id)
        .forEach((entry) => {
          schedule[entry.timeSlot.day][entry.timeSlot.period] = entry
        })

      staffTimetables.push({
        staffId: staff.id,
        staffName: staff.name,
        schedule,
      })
    })

    return staffTimetables
  }
}
