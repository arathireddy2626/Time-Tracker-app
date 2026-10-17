package com.timetracker.firebasebackend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.DocumentSnapshot;
import com.timetracker.firebasebackend.dto.EmployeeReportData;
import com.timetracker.firebasebackend.dto.ProjectContribution;
import com.timetracker.firebasebackend.dto.ProjectReportData;
import com.timetracker.firebasebackend.model.Employee;
import com.timetracker.firebasebackend.model.TimeEntry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import com.google.cloud.Timestamp;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.math.BigDecimal;

@Service
public class ReportService {

    @Autowired
    private Firestore firestore;
    @Autowired
    private EmployeeService employeeService; // Used for name lookups
    
    @org.springframework.beans.factory.annotation.Value("${firebase.collection.timeEntries}")
    private String timeEntriesCollection;
    @org.springframework.beans.factory.annotation.Value("${firebase.collection.projects}")
    private String projectsCollection;

    // --- Helper for calculating duration ---
    private double calculateHours(TimeEntry entry) {
        if (entry.getClockOutTime() == null || entry.getClockInTime() == null) return 0.0;
        long diffSeconds = entry.getClockOutTime().getSeconds() - entry.getClockInTime().getSeconds();
        return diffSeconds / 3600.0;
    }
    
    // --- REPORT 1: Timesheet (GET /reports/timesheet/{id}) ---
    public List<TimeEntry> getEmployeeTimesheet(String employeeId) {
        return getEmployeeTimesheet(employeeId, 30); // Default to last 30 days
    }
    
    public List<TimeEntry> getEmployeeTimesheet(String employeeId, int days) {
        try {
            // For now, let's get all entries for the employee and filter client-side
            // This avoids complex Firestore timestamp queries that might cause issues
            Query query = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries")
                        .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("status", "clocked-out");
            QuerySnapshot snapshot = query.get().get();

            // Defensive mapping to tolerate mixed timestamp types in Firestore (Timestamp, String, Number)
            List<TimeEntry> allEntries = new ArrayList<>();
            for (DocumentSnapshot doc : snapshot.getDocuments()) {
                TimeEntry te = new TimeEntry();
                te.setId(doc.getId());
                te.setEmployeeId(doc.getString("employeeId"));
                te.setProjectId(doc.getString("projectId"));
                te.setStatus(doc.getString("status"));
                te.setClockInTime(parseToTimestamp(doc.get("clockInTime")));
                te.setClockOutTime(parseToTimestamp(doc.get("clockOutTime")));
                allEntries.add(te);
            }
            // Sort in memory to avoid composite index requirements
            allEntries.sort((a, b) -> {
                if (a.getClockInTime() == null && b.getClockInTime() == null) return 0;
                if (a.getClockInTime() == null) return 1;
                if (b.getClockInTime() == null) return -1;
                return b.getClockInTime().compareTo(a.getClockInTime());
            });
            
            // Filter by days if needed (client-side filtering for reliability)
            if (days > 0) {
                long daysAgoMillis = System.currentTimeMillis() - (days * 24L * 60L * 60L * 1000L);
                return allEntries.stream()
                    .filter(entry -> {
                        if (entry.getClockInTime() == null) return false;
                        long entryTime = entry.getClockInTime().getSeconds() * 1000; // Convert to milliseconds
                        return entryTime >= daysAgoMillis;
                    })
                    .collect(java.util.stream.Collectors.toList());
            }
            
            return allEntries;

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve timesheet.", e);
        }
    }

    // Attempt to convert various possible Firestore-stored types into com.google.cloud.Timestamp
    private Timestamp parseToTimestamp(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof Timestamp ts) {
                return ts;
            }
            if (value instanceof java.util.Date d) {
                long ms = d.getTime();
                return Timestamp.ofTimeSecondsAndNanos(ms / 1000L, (int) ((ms % 1000L) * 1_000_000L));
            }
            if (value instanceof Number n) {
                // Treat as epoch millis if large, else epoch seconds
                long num = (n instanceof BigDecimal) ? ((BigDecimal) n).longValue() : n.longValue();
                if (Math.abs(num) > 3_000_000_000L) { // > ~year 2065 in seconds threshold -> assume millis
                    return Timestamp.ofTimeSecondsAndNanos(num / 1000L, (int) ((num % 1000L) * 1_000_000L));
                } else {
                    return Timestamp.ofTimeSecondsAndNanos(num, 0);
                }
            }
            if (value instanceof String s) {
                s = s.trim();
                // Try ISO-8601 first
                try {
                    Instant instant = Instant.parse(s);
                    return Timestamp.ofTimeSecondsAndNanos(instant.getEpochSecond(), instant.getNano());
                } catch (DateTimeParseException ignore) {
                    // Try parse as long (millis or seconds)
                    try {
                        long num = Long.parseLong(s);
                        if (Math.abs(num) > 3_000_000_000L) {
                            return Timestamp.ofTimeSecondsAndNanos(num / 1000L, (int) ((num % 1000L) * 1_000_000L));
                        } else {
                            return Timestamp.ofTimeSecondsAndNanos(num, 0);
                        }
                    } catch (NumberFormatException ignore2) {
                        return null; // Unknown format
                    }
                }
            }
        } catch (Exception ex) {
            // Swallow and return null for resilience
            return null;
        }
        return null;
    }

    // --- REPORT 2: Project Report (GET /reports/projects/{id}) ---
    public ProjectReportData getProjectReport(String projectId) {
        try {
            Query query = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries")
                        .whereEqualTo("projectId", projectId)
                    .whereEqualTo("status", "clocked-out");
            
            QuerySnapshot snapshot = query.get().get();
            
            Map<String, Double> employeeHoursMap = new HashMap<>();
            double totalHours = 0;
            
            for (TimeEntry entry : snapshot.toObjects(TimeEntry.class)) {
                double hours = calculateHours(entry);
                totalHours += hours;
                employeeHoursMap.merge(entry.getEmployeeId(), hours, (a, b) -> (a != null ? a : 0.0) + (b != null ? b : 0.0));
            }
            
            // Map the aggregated hours to DTO list for frontend display
            List<Employee> allEmployees = employeeService.getAllEmployees(); // Assuming this service exists
            List<ProjectContribution> breakdown = employeeHoursMap.entrySet().stream()
                .map(entry -> {
                    Employee emp = allEmployees.stream().filter(e -> e.getId().equals(entry.getKey())).findFirst().orElse(null);
                    ProjectContribution pc = new ProjectContribution();
                    pc.setId(entry.getKey());
                    pc.setName(emp != null ? String.format("%s %s", emp.getFirstName(), emp.getLastName()) : "Unknown Employee");
                    pc.setHours(entry.getValue());
                    return pc;
                }).collect(Collectors.toList());

            ProjectReportData report = new ProjectReportData();
            report.setTotalHours(totalHours);
            report.setEmployeeBreakdown(breakdown);
            return report;

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate project report.", e);
        }
    }

    // --- REPORT 3: Employee Report (GET /reports/employees/{id}) ---
    public EmployeeReportData getEmployeeReport(String employeeId) {
        try {
            Query query = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries")
                        .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("status", "clocked-out");
            
            QuerySnapshot snapshot = query.get().get();
            
            Map<String, Double> projectHoursMap = new HashMap<>();
            
            for (TimeEntry entry : snapshot.toObjects(TimeEntry.class)) {
                double hours = calculateHours(entry);
                projectHoursMap.merge(entry.getProjectId(), hours, (a, b) -> (a != null ? a : 0.0) + (b != null ? b : 0.0));
            }
            
            // Map the aggregated hours to DTO list, fetching project names
            List<ProjectContribution> breakdown = projectHoursMap.entrySet().stream()
                .map(entry -> {
                    // NOTE: Fetch project title for the report
                    String projectName = "Unknown Project";
                    try {
                        String key = entry.getKey();
                        if (key != null && !key.isEmpty()) {
                            DocumentSnapshot projectDoc = firestore.collection(projectsCollection != null ? projectsCollection : "projects").document(key).get().get();
                            if (projectDoc.exists()) {
                                projectName = projectDoc.getString("projectTitle");
                            }
                        }
                    } catch (Exception e) { /* ignore lookup error */ }
                    
                    ProjectContribution pc = new ProjectContribution();
                    pc.setId(entry.getKey());
                    pc.setName(projectName);
                    pc.setHours(entry.getValue());
                    return pc;
                })
                .collect(Collectors.toList());

            EmployeeReportData report = new EmployeeReportData();
            report.setProjectBreakdown(breakdown);
            return report;

        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate employee report.", e);
        }
    }
}