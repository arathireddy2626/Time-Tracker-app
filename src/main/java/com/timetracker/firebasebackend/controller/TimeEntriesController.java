package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.model.TimeEntry;
import com.timetracker.firebasebackend.service.TimeEntryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Complete REST controller for time entries (clock in/out records).
 * Handles all CRUD operations for time entries collection.
 */
@RestController
@RequestMapping({
    "/api/v1/time-entries",
    "/api/v1/timeentries"
})
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
})
public class TimeEntriesController {

    @Autowired
    private TimeEntryService timeEntryService;

    // 1. GET all time entries
    @GetMapping
    public ResponseEntity<List<TimeEntry>> getAllTimeEntries(
            @RequestParam(defaultValue = "30") int days) {
        List<TimeEntry> entries = timeEntryService.getAllTimeEntries(days);
        return ResponseEntity.ok(entries);
    }

    // 2. GET time entries by employee (supports both query param and path param)
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TimeEntry>> getByEmployee(
            @PathVariable String employeeId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(timeEntryService.getTimeEntriesByEmployee(employeeId, days));
    }

    // 3. GET time entries by project
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TimeEntry>> getByProject(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(timeEntryService.getTimeEntriesByProject(projectId, days));
    }

    // 4. POST create time entry (clock in)
    @PostMapping
    public ResponseEntity<TimeEntry> createTimeEntry(@RequestBody TimeEntry timeEntry) {
        TimeEntry created = timeEntryService.createTimeEntry(timeEntry);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // 5. PUT update time entry (clock out or modify)
    @PutMapping("/{id}")
    public ResponseEntity<TimeEntry> updateTimeEntry(
            @PathVariable String id,
            @RequestBody TimeEntry updates) {
        TimeEntry updated = timeEntryService.updateTimeEntry(id, updates);
        return ResponseEntity.ok(updated);
    }

    // 6. DELETE time entry
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTimeEntry(@PathVariable String id) {
        timeEntryService.deleteTimeEntry(id);
        return ResponseEntity.noContent().build();
    }
}
