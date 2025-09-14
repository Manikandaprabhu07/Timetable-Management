"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ClassTimetable, StaffTimetable, TimetableEntry, Subject, Staff, Class } from "@/types/timetable"

interface TimetableGridProps {
  timetable: ClassTimetable | StaffTimetable
  subjects: Subject[]
  staff: Staff[]
  classes: Class[]
  type: "class" | "staff"
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const PERIODS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"]

export function TimetableGrid({ timetable, subjects, staff, classes, type }: TimetableGridProps) {
  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject"
  }

  const getStaffName = (staffId: string) => {
    return staff.find((s) => s.id === staffId)?.name || "Unknown Staff"
  }

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.displayName || "Unknown Class"
  }

  const renderCell = (entry: TimetableEntry | null, day: number, period: number) => {
    if (!entry) {
      return (
        <div className="h-20 border border-border rounded-md bg-muted/30 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Free</span>
        </div>
      )
    }

    const subjectName = getSubjectName(entry.subjectId)
    const staffName = getStaffName(entry.staffId)
    const className = getClassName(entry.classId)

    return (
      <div className="h-20 border border-border rounded-md bg-card p-2 flex flex-col justify-between hover:shadow-sm transition-shadow">
        <div className="flex-1">
          <div className="font-medium text-sm text-foreground truncate">{subjectName}</div>
          {type === "class" ? (
            <div className="text-xs text-muted-foreground truncate">{staffName}</div>
          ) : (
            <div className="text-xs text-muted-foreground truncate">{className}</div>
          )}
        </div>
        <Badge variant="secondary" className="text-xs self-start">
          {`${day + 1}-${period + 1}`}
        </Badge>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {type === "class" ? (timetable as ClassTimetable).className : (timetable as StaffTimetable).staffName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="font-medium text-sm text-center py-2">Period</div>
              {DAYS.map((day) => (
                <div key={day} className="font-medium text-sm text-center py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Timetable rows */}
            {PERIODS.map((periodName, periodIndex) => (
              <div key={periodIndex} className="grid grid-cols-8 gap-2 mb-2">
                <div className="flex items-center justify-center bg-muted rounded-md">
                  <span className="font-medium text-sm">{periodName}</span>
                </div>
                {DAYS.map((_, dayIndex) => (
                  <div key={dayIndex}>
                    {renderCell(timetable.schedule[dayIndex][periodIndex], dayIndex, periodIndex)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
