"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClassForm } from "@/components/data-input/class-form"
import { SubjectForm } from "@/components/data-input/subject-form"
import { StaffForm } from "@/components/data-input/staff-form"
import { TimetableGeneratorForm } from "@/components/generation/timetable-generator-form"
import type { Class, Subject, Staff } from "@/types/timetable"
import { storage } from "@/lib/timetable-storage"
import { Calendar, Users, BookOpen, Settings, Eye } from "lucide-react"
import type { GenerationResult } from "@/lib/timetable-generator"
import Link from "next/link"

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  // Load data from localStorage on component mount
  useEffect(() => {
    setClasses(storage.getClasses())
    setSubjects(storage.getSubjects())
    setStaff(storage.getStaff())
    setGeneratedCount(storage.getTimetables().length)
  }, [])

  const canGenerateTimetable = classes.length > 0 && subjects.length > 0 && staff.length > 0

  const handleGenerationComplete = (result: GenerationResult) => {
    if (result.success) {
      setGeneratedCount(storage.getTimetables().length)
      // Redirect to timetables page to view the result
      window.location.href = "/timetables"
    } else {
      // Show errors (you could implement a toast notification here)
      alert(`Generation failed:\n${result.errors.join("\n")}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Time Table Management System</h1>
          <p className="text-muted-foreground text-lg">
            Automatically generate conflict-free schedules for students and staff
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{classes.length}</p>
                <p className="text-muted-foreground">Classes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{subjects.length}</p>
                <p className="text-muted-foreground">Subjects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Settings className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{staff.length}</p>
                <p className="text-muted-foreground">Staff Members</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{generatedCount}</p>
                <p className="text-muted-foreground">Generated</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-6">
          {generatedCount > 0 && (
            <Link href="/timetables">
              <Button variant="outline" size="lg">
                <Eye className="w-5 h-5 mr-2" />
                View Generated Timetables ({generatedCount})
              </Button>
            </Link>
          )}
          {canGenerateTimetable && (
            <Button size="lg" onClick={() => setShowGenerator(!showGenerator)} className="px-8">
              <Calendar className="w-5 h-5 mr-2" />
              {showGenerator ? "Hide Generator" : "Generate New Timetable"}
            </Button>
          )}
        </div>

        {showGenerator && canGenerateTimetable && (
          <div className="mb-8">
            <TimetableGeneratorForm
              classes={classes}
              subjects={subjects}
              staff={staff}
              onGenerationComplete={handleGenerationComplete}
            />
          </div>
        )}

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            <ClassForm classes={classes} onClassesChange={setClasses} />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectForm subjects={subjects} classes={classes} onSubjectsChange={setSubjects} />
          </TabsContent>

          <TabsContent value="staff">
            <StaffForm staff={staff} subjects={subjects} onStaffChange={setStaff} />
          </TabsContent>
        </Tabs>

        {!canGenerateTimetable && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Please add at least one class, subject, and staff member to generate a timetable
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
