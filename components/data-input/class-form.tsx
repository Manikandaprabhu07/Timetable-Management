"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"
import type { Class } from "@/types/timetable"
import { storage } from "@/lib/timetable-storage"

interface ClassFormProps {
  classes: Class[]
  onClassesChange: (classes: Class[]) => void
}

export function ClassForm({ classes, onClassesChange }: ClassFormProps) {
  const [newClass, setNewClass] = useState({ name: "", section: "" })

  const addClassHandler = () => {
    if (!newClass.name.trim() || !newClass.section.trim()) return

    const classToAdd: Class = {
      id: Date.now().toString(),
      name: newClass.name.trim(),
      section: newClass.section.trim(),
      displayName: `${newClass.name.trim()} ${newClass.section.trim()}`,
    }

    const updatedClasses = [...classes, classToAdd]
    onClassesChange(updatedClasses)
    storage.saveClasses(updatedClasses)
    setNewClass({ name: "", section: "" })
  }

  const removeClassHandler = (id: string) => {
    const updatedClasses = classes.filter((c) => c.id !== id)
    onClassesChange(updatedClasses)
    storage.saveClasses(updatedClasses)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              placeholder="e.g., 10th, 11th Science"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              placeholder="e.g., A, B, C"
              value={newClass.section}
              onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={addClassHandler} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>

        {classes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Added Classes:</h4>
            {classes.map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <span>{cls.displayName}</span>
                <Button variant="ghost" size="sm" onClick={() => removeClassHandler(cls.id)}>
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
