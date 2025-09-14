"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { GeneratedTimetable, ClassTimetable, StaffTimetable } from "@/types/timetable"
import { Calendar, Users, BookOpen, Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface TimetableSummaryProps {
  timetable: GeneratedTimetable
  classTimetables: ClassTimetable[]
  staffTimetables: StaffTimetable[]
  errors: string[]
  warnings: string[]
}

export function TimetableSummary({
  timetable,
  classTimetables,
  staffTimetables,
  errors,
  warnings,
}: TimetableSummaryProps) {
  const totalSlots = timetable.classes.length * 6 * 7 // 6 days, 7 periods per class
  const filledSlots = timetable.entries.length
  const utilizationRate = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0

  const getSubjectDistribution = () => {
    const distribution = new Map<string, number>()
    timetable.entries.forEach((entry) => {
      const current = distribution.get(entry.subjectId) || 0
      distribution.set(entry.subjectId, current + 1)
    })
    return distribution
  }

  const getStaffWorkload = () => {
    const workload = new Map<string, number>()
    timetable.entries.forEach((entry) => {
      const current = workload.get(entry.staffId) || 0
      workload.set(entry.staffId, current + 1)
    })
    return workload
  }

  const subjectDistribution = getSubjectDistribution()
  const staffWorkload = getStaffWorkload()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{timetable.name}</CardTitle>
              <p className="text-muted-foreground">Generated on {timetable.createdAt.toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              {errors.length === 0 ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Success
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Issues
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{timetable.classes.length}</p>
              <p className="text-muted-foreground">Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <BookOpen className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{timetable.subjects.length}</p>
              <p className="text-muted-foreground">Subjects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{timetable.staff.length}</p>
              <p className="text-muted-foreground">Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{filledSlots}</p>
              <p className="text-muted-foreground">Periods</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Filled Slots</span>
              <span>
                {filledSlots} / {totalSlots} ({utilizationRate.toFixed(1)}%)
              </span>
            </div>
            <Progress value={utilizationRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Subject Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from(subjectDistribution.entries()).map(([subjectId, count]) => {
              const subject = timetable.subjects.find((s) => s.id === subjectId)
              const percentage = totalSlots > 0 ? (count / filledSlots) * 100 : 0
              return (
                <div key={subjectId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{subject?.name || "Unknown"}</span>
                    <span>
                      {count} periods ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Staff Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from(staffWorkload.entries()).map(([staffId, count]) => {
              const staff = timetable.staff.find((s) => s.id === staffId)
              const maxPossible = 6 * 7 // 6 days, 7 periods max
              const percentage = (count / maxPossible) * 100
              return (
                <div key={staffId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{staff?.name || "Unknown"}</span>
                    <span>
                      {count} periods ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Errors and Warnings */}
      {(errors.length > 0 || warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Generation Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.length > 0 && (
              <div>
                <h4 className="font-medium text-destructive mb-2">Errors:</h4>
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-destructive flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-600 mb-2">Warnings:</h4>
                <ul className="space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
