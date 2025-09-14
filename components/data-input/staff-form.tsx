"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus } from "lucide-react"
import type { Staff, Subject } from "@/types/timetable"
import { storage } from "@/lib/timetable-storage"

interface StaffFormProps {
  staff: Staff[]
  subjects: Subject[]
  onStaffChange: (staff: Staff[]) => void
}

export function StaffForm({ staff, subjects, onStaffChange }: StaffFormProps) {
  const [newStaff, setNewStaff] = useState({ name: "", email: "", subjects: [] as string[] })

  const addStaffHandler = () => {
    if (!newStaff.name.trim() || newStaff.subjects.length === 0) return

    const staffToAdd: Staff = {
      id: Date.now().toString(),
      name: newStaff.name.trim(),
      email: newStaff.email.trim() || undefined,
      subjects: newStaff.subjects,
    }

    const updatedStaff = [...staff, staffToAdd]
    onStaffChange(updatedStaff)
    storage.saveStaff(updatedStaff)
    setNewStaff({ name: "", email: "", subjects: [] })
  }

  const removeStaffHandler = (id: string) => {
    const updatedStaff = staff.filter((s) => s.id !== id)
    onStaffChange(updatedStaff)
    storage.saveStaff(updatedStaff)
  }

  const handleSubjectToggle = (subjectId: string, checked: boolean) => {
    if (checked) {
      setNewStaff({ ...newStaff, subjects: [...newStaff.subjects, subjectId] })
    } else {
      setNewStaff({ ...newStaff, subjects: newStaff.subjects.filter((id) => id !== subjectId) })
    }
  }

  const getSubjectNames = (subjectIds: string[]) => {
    return subjectIds
      .map((id) => subjects.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="staffName">Staff Name</Label>
            <Input
              id="staffName"
              placeholder="e.g., John Smith"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="staffEmail">Email (Optional)</Label>
            <Input
              id="staffEmail"
              type="email"
              placeholder="john@school.edu"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
            />
          </div>
        </div>

        {subjects.length > 0 && (
          <div>
            <Label>Subjects this staff can teach:</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${subject.id}`}
                    checked={newStaff.subjects.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectToggle(subject.id, checked as boolean)}
                  />
                  <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                    {subject.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={addStaffHandler}
          className="w-full"
          disabled={!newStaff.name.trim() || newStaff.subjects.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>

        {staff.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Added Staff:</h4>
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">Subjects: {getSubjectNames(member.subjects)}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeStaffHandler(member.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
