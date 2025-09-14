"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Table, ImageIcon } from "lucide-react"
import type { GeneratedTimetable, ClassTimetable, StaffTimetable } from "@/types/timetable"

interface ExportOptionsProps {
  timetable: GeneratedTimetable
  classTimetables: ClassTimetable[]
  staffTimetables: StaffTimetable[]
}

export function ExportOptions({ timetable, classTimetables, staffTimetables }: ExportOptionsProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "json">("csv")
  const [includeClasses, setIncludeClasses] = useState(true)
  const [includeStaff, setIncludeStaff] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)

  const exportToCSV = () => {
    let csvContent = ""

    if (includeSummary) {
      csvContent += `Timetable Name,${timetable.name}\n`
      csvContent += `Generated On,${timetable.createdAt.toLocaleDateString()}\n`
      csvContent += `Classes,${timetable.classes.length}\n`
      csvContent += `Subjects,${timetable.subjects.length}\n`
      csvContent += `Staff,${timetable.staff.length}\n`
      csvContent += `Total Periods,${timetable.entries.length}\n\n`
    }

    if (includeClasses) {
      csvContent += "CLASS TIMETABLES\n"
      csvContent += "Class,Day,Period,Subject,Staff\n"

      classTimetables.forEach((classTable) => {
        classTable.schedule.forEach((day, dayIndex) => {
          day.forEach((entry, periodIndex) => {
            if (entry) {
              const subject = timetable.subjects.find((s) => s.id === entry.subjectId)?.name || "Unknown"
              const staff = timetable.staff.find((s) => s.id === entry.staffId)?.name || "Unknown"
              const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex]
              csvContent += `${classTable.className},${dayName},${periodIndex + 1},${subject},${staff}\n`
            }
          })
        })
      })
      csvContent += "\n"
    }

    if (includeStaff) {
      csvContent += "STAFF TIMETABLES\n"
      csvContent += "Staff,Day,Period,Subject,Class\n"

      staffTimetables.forEach((staffTable) => {
        staffTable.schedule.forEach((day, dayIndex) => {
          day.forEach((entry, periodIndex) => {
            if (entry) {
              const subject = timetable.subjects.find((s) => s.id === entry.subjectId)?.name || "Unknown"
              const className = timetable.classes.find((c) => c.id === entry.classId)?.displayName || "Unknown"
              const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex]
              csvContent += `${staffTable.staffName},${dayName},${periodIndex + 1},${subject},${className}\n`
            }
          })
        })
      })
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${timetable.name.replace(/\s+/g, "_")}_timetable.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    const exportData = {
      timetable,
      classTimetables: includeClasses ? classTimetables : undefined,
      staffTimetables: includeStaff ? staffTimetables : undefined,
      exportedAt: new Date().toISOString(),
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${timetable.name.replace(/\s+/g, "_")}_timetable.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printTimetables = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    let htmlContent = `
      <html>
        <head>
          <title>${timetable.name} - Timetables</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .timetable { margin-bottom: 40px; page-break-inside: avoid; }
            .timetable h2 { border-bottom: 2px solid #333; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .subject { font-weight: bold; }
            .staff { font-size: 0.9em; color: #666; }
            .free { color: #999; font-style: italic; }
            @media print { .timetable { page-break-after: always; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${timetable.name}</h1>
            <p>Generated on ${timetable.createdAt.toLocaleDateString()}</p>
          </div>
    `

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const periods = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"]

    if (includeClasses) {
      classTimetables.forEach((classTable) => {
        htmlContent += `
          <div class="timetable">
            <h2>${classTable.className} - Class Timetable</h2>
            <table>
              <tr>
                <th>Period</th>
                ${days.map((day) => `<th>${day}</th>`).join("")}
              </tr>
        `

        periods.forEach((periodName, periodIndex) => {
          htmlContent += `<tr><td><strong>${periodName}</strong></td>`
          days.forEach((_, dayIndex) => {
            const entry = classTable.schedule[dayIndex][periodIndex]
            if (entry) {
              const subject = timetable.subjects.find((s) => s.id === entry.subjectId)?.name || "Unknown"
              const staff = timetable.staff.find((s) => s.id === entry.staffId)?.name || "Unknown"
              htmlContent += `<td><div class="subject">${subject}</div><div class="staff">${staff}</div></td>`
            } else {
              htmlContent += `<td class="free">Free</td>`
            }
          })
          htmlContent += `</tr>`
        })

        htmlContent += `</table></div>`
      })
    }

    if (includeStaff) {
      staffTimetables.forEach((staffTable) => {
        htmlContent += `
          <div class="timetable">
            <h2>${staffTable.staffName} - Staff Timetable</h2>
            <table>
              <tr>
                <th>Period</th>
                ${days.map((day) => `<th>${day}</th>`).join("")}
              </tr>
        `

        periods.forEach((periodName, periodIndex) => {
          htmlContent += `<tr><td><strong>${periodName}</strong></td>`
          days.forEach((_, dayIndex) => {
            const entry = staffTable.schedule[dayIndex][periodIndex]
            if (entry) {
              const subject = timetable.subjects.find((s) => s.id === entry.subjectId)?.name || "Unknown"
              const className = timetable.classes.find((c) => c.id === entry.classId)?.displayName || "Unknown"
              htmlContent += `<td><div class="subject">${subject}</div><div class="staff">${className}</div></td>`
            } else {
              htmlContent += `<td class="free">Free</td>`
            }
          })
          htmlContent += `</tr>`
        })

        htmlContent += `</table></div>`
      })
    }

    htmlContent += `</body></html>`

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExport = () => {
    switch (exportFormat) {
      case "csv":
        exportToCSV()
        break
      case "json":
        exportToJSON()
        break
      case "pdf":
        printTimetables()
        break
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Timetables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="exportFormat">Export Format</Label>
          <Select value={exportFormat} onValueChange={(value: "csv" | "pdf" | "json") => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  CSV (Spreadsheet)
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF (Print)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  JSON (Data)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Include in Export:</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeClasses"
                checked={includeClasses}
                onCheckedChange={(checked) => setIncludeClasses(checked as boolean)}
              />
              <Label htmlFor="includeClasses">Class Timetables</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeStaff"
                checked={includeStaff}
                onCheckedChange={(checked) => setIncludeStaff(checked as boolean)}
              />
              <Label htmlFor="includeStaff">Staff Timetables</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSummary"
                checked={includeSummary}
                onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
              />
              <Label htmlFor="includeSummary">Summary Information</Label>
            </div>
          </div>
        </div>

        <Button onClick={handleExport} className="w-full" size="lg">
          <Download className="w-4 h-4 mr-2" />
          Export {exportFormat.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  )
}
