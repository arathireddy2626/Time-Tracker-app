package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.model.TimeEntry;
import com.timetracker.firebasebackend.service.TimeClockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/clock")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
})
public class TimeClockController {

    // --- Inner Class for Request Body Mapping ---
    public static class ClockInRequest {
        public String employeeId;
        public String projectId;
    }
    // -------------------------------------------

    private final TimeClockService timeClockService;

    @Autowired
    public TimeClockController(TimeClockService timeClockService) {
        this.timeClockService = timeClockService;
    }

    @GetMapping("/active/{employeeId}")
    public ResponseEntity<TimeEntry> getActiveEntry(@PathVariable String employeeId) {
        TimeEntry activeEntry = timeClockService.getActiveEntry(employeeId);
        if (activeEntry != null) {
            return ResponseEntity.ok(activeEntry);
        } else {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
    }

    @PostMapping("/in")
    public ResponseEntity<TimeEntry> clockIn(@RequestBody ClockInRequest request) {
        if (request.employeeId == null || request.projectId == null) {
            return ResponseEntity.badRequest().build();
        }
        TimeEntry newEntry = timeClockService.clockIn(request.employeeId, request.projectId);
        return ResponseEntity.status(HttpStatus.CREATED).body(newEntry);
    }

    @PostMapping("/out/{activeEntryId}")
    public ResponseEntity<Void> clockOut(@PathVariable String activeEntryId) {
        timeClockService.clockOut(activeEntryId);
        return ResponseEntity.ok().build();
    }

    // Validation endpoint to check if employee can clock in to a project
    @GetMapping("/validate/{employeeId}/{projectId}")
    public ResponseEntity<Map<String, Object>> validateAssignment(@PathVariable String employeeId, @PathVariable String projectId) {
        boolean isAssigned = timeClockService.isEmployeeAssignedToProject(employeeId, projectId);
        TimeEntry activeEntry = timeClockService.getActiveEntry(employeeId);
        
        return ResponseEntity.ok(Map.of(
            "isAssigned", isAssigned,
            "hasActiveEntry", activeEntry != null,
            "canClockIn", isAssigned && activeEntry == null
        ));
    }
}