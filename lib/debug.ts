// Debug utility functions to help troubleshoot schedule issues

export function logScheduleOperation(operation: string, schedule: any, success = true) {
  if (process.env.NODE_ENV !== "production") {
    console.group(`Schedule Operation: ${operation} ${success ? "✅" : "❌"}`)
    console.log("Schedule:", schedule)
    console.log("Day:", schedule.day)
    console.log("Timestamp:", new Date().toISOString())
    console.groupEnd()
  }
}

export function validateSchedule(schedule: any): boolean {
  // Basic validation to ensure schedule has all required fields
  const requiredFields = ["id", "day", "teacherId", "subjectId", "periodId", "classId"]

  const missingFields = requiredFields.filter((field) => !schedule[field])

  if (missingFields.length > 0) {
    console.error("Invalid schedule - missing fields:", missingFields)
    return false
  }

  return true
}
