"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Calendar, Settings, Loader2 } from "lucide-react"
import type { Class, Subject, Staff, TimetableConstraints } from "@/types/timetable"
import { TimetableGenerator, type GenerationOptions, type GenerationResult } from "@/lib/timetable-generator"
import { storage } from "@/lib/timetable-storage"

interface TimetableGeneratorFormProps {
  classes: Class[]
  subjects: Subject[]
  staff: Staff[]
  onGenerationComplete: (result: GenerationResult) => void
}

export function TimetableGeneratorForm({
  classes,
  subjects,
  staff,
  onGenerationComplete,
}: TimetableGeneratorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [options, setOptions] = useState<GenerationOptions>({
    name: `Timetable ${new Date().toLocaleDateString()}`,
  })
  const [constraints, setConstraints] = useState<Partial<TimetableConstraints>>({
    workingDays: 6,
    periodsPerDay: 7,
    noConsecutiveSubjects: true,
    includeFreePeriods: true,
  })

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const result = TimetableGenerator.generate(classes, subjects, staff, {
        ...options,
        constraints,
      })

      // Save the timetable if generation was successful
      if (result.success && result.timetable) {
        storage.saveTimetable(result.timetable)
      }

      onGenerationComplete(result)
    } catch (error) {
      onGenerationComplete({
        success: false,
        errors: ["An unexpected error occurred during generation"],
        warnings: [],
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = classes.length > 0 && subjects.length > 0 && staff.length > 0 && options.name.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Timetable Generation Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="timetableName">Timetable Name</Label>
          <Input
            id="timetableName"
            placeholder="e.g., Spring 2024 Schedule"
            value={options.name}
            onChange={(e) => setOptions({ ...options, name: e.target.value })}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Schedule Constraints</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workingDays">Working Days per Week</Label>
              <Input
                id="workingDays"
                type="number"
                min="1"
                max="7"
                value={constraints.workingDays || 6}
                onChange={(e) =>
                  setConstraints({
                    ...constraints,
                    workingDays: Number.parseInt(e.target.value) || 6,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="periodsPerDay">Periods per Day</Label>
              <Input
                id="periodsPerDay"
                type="number"
                min="1"
                max="12"
                value={constraints.periodsPerDay || 7}
                onChange={(e) =>
                  setConstraints({
                    ...constraints,
                    periodsPerDay: Number.parseInt(e.target.value) || 7,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="noConsecutive"
                checked={constraints.noConsecutiveSubjects}
                onCheckedChange={(checked) =>
                  setConstraints({
                    ...constraints,
                    noConsecutiveSubjects: checked as boolean,
                  })
                }
              />
              <Label htmlFor="noConsecutive">Prevent consecutive periods of the same subject</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeFreePeriods"
                checked={constraints.includeFreePeriods}
                onCheckedChange={(checked) =>
                  setConstraints({
                    ...constraints,
                    includeFreePeriods: checked as boolean,
                  })
                }
              />
              <Label htmlFor="includeFreePeriods">Include free periods for staff</Label>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium">Generation Summary</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Classes: {classes.length}</p>
            <p>Subjects: {subjects.length}</p>
            <p>Staff Members: {staff.length}</p>
            <p>Total Time Slots: {(constraints.workingDays || 6) * (constraints.periodsPerDay || 7)} per class</p>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="w-full" size="lg">
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Timetable...
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5 mr-2" />
              Generate Timetable
            </>
          )}
        </Button>

        {!canGenerate && !isGenerating && (
          <p className="text-sm text-muted-foreground text-center">
            {!options.name.trim()
              ? "Please enter a timetable name"
              : "Please add classes, subjects, and staff members first"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
