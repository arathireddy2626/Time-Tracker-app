package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.model.TimeEntry;
import com.timetracker.firebasebackend.service.ReportService;
import com.timetracker.firebasebackend.service.TimeClockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
// NOTE: Disabled legacy controller to avoid duplicate mappings with TimeEntriesController.
// Keeping the code for reference but moving it under a non-public base path.
@RequestMapping("/api/_disabled/time-entries")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
})
public class TimeEntryController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private TimeClockService timeClockService;

    // GET all time entries (fetches completed time entries across all employees)
    @GetMapping
    public ResponseEntity<List<TimeEntry>> getAllTimeEntries(@RequestParam(defaultValue = "30") int days) {
        // This returns all completed time entries for the last N days
        // For now, we'll delegate to get timesheet for a specific employee
        // If you need truly "all employees", we can enhance ReportService
        List<TimeEntry> entries = reportService.getEmployeeTimesheet("", days);
        return ResponseEntity.ok(entries);
    }

    // GET time entries by employee
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TimeEntry>> getTimeEntriesByEmployee(
            @PathVariable String employeeId,
            @RequestParam(defaultValue = "30") int days) {
        List<TimeEntry> entries = reportService.getEmployeeTimesheet(employeeId, days);
        return ResponseEntity.ok(entries);
    }

    // GET time entries by project
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TimeEntry>> getTimeEntriesByProject(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "30") int days) {
        // For now, return empty list; you can enhance ReportService to filter by projectId
        return ResponseEntity.ok(List.of());
    }

    // POST create time entry (clock in)
    @PostMapping
    public ResponseEntity<TimeEntry> createTimeEntry(@RequestBody TimeClockController.ClockInRequest request) {
        if (request.employeeId == null || request.projectId == null) {
            return ResponseEntity.badRequest().build();
        }
        TimeEntry newEntry = timeClockService.clockIn(request.employeeId, request.projectId);
        return ResponseEntity.status(HttpStatus.CREATED).body(newEntry);
    }

    // PUT update time entry (clock out)
    @PutMapping("/{entryId}")
    public ResponseEntity<Void> updateTimeEntry(@PathVariable String entryId) {
        timeClockService.clockOut(entryId);
        return ResponseEntity.ok().build();
    }

    // DELETE time entry
    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> deleteTimeEntry(@PathVariable String entryId) {
        timeClockService.clockOut(entryId); // For now, clock out = soft delete
        return ResponseEntity.noContent().build();
    }
}
