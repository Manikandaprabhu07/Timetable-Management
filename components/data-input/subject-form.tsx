"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Users, BookOpen } from "lucide-react"
import type { Subject, Class, GeneratedTimetable } from "@/types/timetable"
import { storage } from "@/lib/timetable-storage"

interface SubjectFormProps {
  subjects: Subject[]
  classes: Class[]
  onSubjectsChange: (subjects: Subject[]) => void
}

export function SubjectForm({ subjects, classes, onSubjectsChange }: SubjectFormProps) {
  const [newSubject, setNewSubject] = useState({
    name: "",
    periodsPerWeek: 5,
    selectedClasses: [] as string[],
  })

  const getClassesForSubject = (subjectId: string): Class[] => {
    const timetables = storage.getTimetables()
    const classIds = new Set<string>()

    // Find all classes that have this subject in any generated timetable
    timetables.forEach((timetable: GeneratedTimetable) => {
      timetable.entries.forEach((entry) => {
        if (entry.subjectId === subjectId) {
          classIds.add(entry.classId)
        }
      })
    })

    // Return the actual class objects
    return classes.filter((cls) => classIds.has(cls.id))
  }

  const handleClassSelection = (classId: string, checked: boolean) => {
    setNewSubject((prev) => ({
      ...prev,
      selectedClasses: checked
        ? [...prev.selectedClasses, classId]
        : prev.selectedClasses.filter((id) => id !== classId),
    }))
  }

  const addSubjectHandler = () => {
    if (!newSubject.name.trim()) return

    const subjectToAdd: Subject = {
      id: Date.now().toString(),
      name: newSubject.name.trim(),
      periodsPerWeek: newSubject.periodsPerWeek,
      assignedClasses: newSubject.selectedClasses.length > 0 ? newSubject.selectedClasses : undefined,
    }

    const updatedSubjects = [...subjects, subjectToAdd]
    onSubjectsChange(updatedSubjects)
    storage.saveSubjects(updatedSubjects)
    setNewSubject({ name: "", periodsPerWeek: 5, selectedClasses: [] })
  }

  const removeSubjectHandler = (id: string) => {
    const updatedSubjects = subjects.filter((s) => s.id !== id)
    onSubjectsChange(updatedSubjects)
    storage.saveSubjects(updatedSubjects)
  }

  const getAssignedClasses = (subject: Subject): Class[] => {
    if (!subject.assignedClasses) return []
    return classes.filter((cls) => subject.assignedClasses?.includes(cls.id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subjectName">Subject Name</Label>
            <Input
              id="subjectName"
              placeholder="e.g., Mathematics, English"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="periodsPerWeek">Periods per Week</Label>
            <Input
              id="periodsPerWeek"
              type="number"
              min="1"
              max="42"
              value={newSubject.periodsPerWeek}
              onChange={(e) => setNewSubject({ ...newSubject, periodsPerWeek: Number.parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {classes.length > 0 && (
          <div>
            <Label className="text-sm font-medium">Select Classes for this Subject:</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-muted/50 rounded">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`class-${cls.id}`}
                    checked={newSubject.selectedClasses.includes(cls.id)}
                    onCheckedChange={(checked) => handleClassSelection(cls.id, checked as boolean)}
                  />
                  <Label htmlFor={`class-${cls.id}`} className="text-sm">
                    {cls.displayName}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={addSubjectHandler} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>

        {subjects.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Added Subjects:</h4>
            {subjects.map((subject) => {
              const scheduledClasses = getClassesForSubject(subject.id)
              const assignedClasses = getAssignedClasses(subject)

              return (
                <div key={subject.id} className="p-3 bg-muted rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {subject.name} ({subject.periodsPerWeek} periods/week)
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => removeSubjectHandler(subject.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {assignedClasses.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-muted-foreground">Assigned to:</span>
                      <div className="flex flex-wrap gap-1">
                        {assignedClasses.map((cls) => (
                          <Badge key={cls.id} variant="default" className="text-xs bg-blue-100 text-blue-800">
                            {cls.displayName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-muted-foreground">Scheduled in:</span>
                    {scheduledClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {scheduledClasses.map((cls) => (
                          <Badge key={cls.id} variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {cls.displayName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No timetables generated yet</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
