package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.dto.ProjectReportData;
import com.timetracker.firebasebackend.dto.EmployeeReportData;
import com.timetracker.firebasebackend.model.TimeEntry;
import com.timetracker.firebasebackend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175"
})
public class ReportController {

    @Autowired
    private ReportService reportService;

    // GET /reports/timesheet/{id} (MyTimesheet.jsx)
    @GetMapping("/timesheet/{employeeId}")
    public ResponseEntity<List<TimeEntry>> getEmployeeTimesheet(
            @PathVariable String employeeId,
            @RequestParam(defaultValue = "30") int days) {
        List<TimeEntry> entries = reportService.getEmployeeTimesheet(employeeId, days);
        return ResponseEntity.ok(entries);
    }

    // GET /reports/projects/{id} (GenerateProjectReport.jsx)
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<ProjectReportData> getProjectReport(@PathVariable String projectId) {
        ProjectReportData report = reportService.getProjectReport(projectId);
        return ResponseEntity.ok(report);
    }

    // GET /reports/employees/{id} (GenerateEmployeeReport.jsx)
    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<EmployeeReportData> getEmployeeReport(@PathVariable String employeeId) {
        EmployeeReportData report = reportService.getEmployeeReport(employeeId);
        return ResponseEntity.ok(report);
    }

    // GET /reports/employee/{id} - Alternative singular endpoint with optional date range
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<EmployeeReportData> getEmployeeReportAlt(
            @PathVariable String employeeId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        // Note: date filtering not yet implemented in ReportService, returns full report
        EmployeeReportData report = reportService.getEmployeeReport(employeeId);
        return ResponseEntity.ok(report);
    }

    // GET /reports/project/{id} - Alternative singular endpoint with optional date range
    @GetMapping("/project/{projectId}")
    public ResponseEntity<ProjectReportData> getProjectReportAlt(
            @PathVariable String projectId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        // Note: date filtering not yet implemented in ReportService, returns full report
        ProjectReportData report = reportService.getProjectReport(projectId);
        return ResponseEntity.ok(report);
    }
}