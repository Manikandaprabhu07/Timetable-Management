"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TimetableGrid } from "@/components/display/timetable-grid"
import { TimetableSummary } from "@/components/display/timetable-summary"
import { ExportOptions } from "@/components/display/export-options"
import { TimetableGenerator, type GenerationResult } from "@/lib/timetable-generator"
import { storage } from "@/lib/timetable-storage"
import type { GeneratedTimetable, ClassTimetable, StaffTimetable } from "@/types/timetable"
import { Calendar, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"

export default function TimetablesPage() {
  const [timetables, setTimetables] = useState<GeneratedTimetable[]>([])
  const [selectedTimetable, setSelectedTimetable] = useState<GeneratedTimetable | null>(null)
  const [classTimetables, setClassTimetables] = useState<ClassTimetable[]>([])
  const [staffTimetables, setStaffTimetables] = useState<StaffTimetable[]>([])
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)

  useEffect(() => {
    loadTimetables()
  }, [])

  const loadTimetables = () => {
    const saved = storage.getTimetables()
    setTimetables(saved)
    if (saved.length > 0 && !selectedTimetable) {
      selectTimetable(saved[0])
    }
  }

  const selectTimetable = (timetable: GeneratedTimetable) => {
    setSelectedTimetable(timetable)

    // Generate display timetables
    const result = TimetableGenerator.generate(timetable.classes, timetable.subjects, timetable.staff, {
      name: timetable.name,
    })

    if (result.success && result.classTimetables && result.staffTimetables) {
      setClassTimetables(result.classTimetables)
      setStaffTimetables(result.staffTimetables)
      setGenerationResult(result)
    }
  }

  const deleteTimetable = (id: string) => {
    storage.deleteTimetable(id)
    loadTimetables()
    if (selectedTimetable?.id === id) {
      setSelectedTimetable(null)
      setClassTimetables([])
      setStaffTimetables([])
      setGenerationResult(null)
    }
  }

  if (timetables.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Timetables Generated</h1>
            <p className="text-muted-foreground mb-6">Create your first timetable to get started.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back to Setup
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Generated Timetables</h1>
            <p className="text-muted-foreground">View and export your generated schedules</p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Timetable List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Saved Timetables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {timetables.map((timetable) => (
                <div
                  key={timetable.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTimetable?.id === timetable.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => selectTimetable(timetable)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{timetable.name}</h3>
                      <p className="text-xs text-muted-foreground">{timetable.createdAt.toLocaleDateString()}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {timetable.classes.length} classes
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTimetable(timetable.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timetable Display */}
          <div className="lg:col-span-3">
            {selectedTimetable && generationResult ? (
              <Tabs defaultValue="summary" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="classes">Classes</TabsTrigger>
                  <TabsTrigger value="staff">Staff</TabsTrigger>
                  <TabsTrigger value="export">Export</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <TimetableSummary
                    timetable={selectedTimetable}
                    classTimetables={classTimetables}
                    staffTimetables={staffTimetables}
                    errors={generationResult.errors}
                    warnings={generationResult.warnings}
                  />
                </TabsContent>

                <TabsContent value="classes" className="space-y-6">
                  {classTimetables.map((classTable) => (
                    <TimetableGrid
                      key={classTable.classId}
                      timetable={classTable}
                      subjects={selectedTimetable.subjects}
                      staff={selectedTimetable.staff}
                      classes={selectedTimetable.classes}
                      type="class"
                    />
                  ))}
                </TabsContent>

                <TabsContent value="staff" className="space-y-6">
                  {staffTimetables.map((staffTable) => (
                    <TimetableGrid
                      key={staffTable.staffId}
                      timetable={staffTable}
                      subjects={selectedTimetable.subjects}
                      staff={selectedTimetable.staff}
                      classes={selectedTimetable.classes}
                      type="staff"
                    />
                  ))}
                </TabsContent>

                <TabsContent value="export">
                  <ExportOptions
                    timetable={selectedTimetable}
                    classTimetables={classTimetables}
                    staffTimetables={staffTimetables}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Select a timetable to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
