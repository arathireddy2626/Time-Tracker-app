package com.timetracker.firebasebackend.model;

import com.google.cloud.Timestamp;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public class TimeEntry {

    private String id; // Firestore Document ID

    // Fields based on PDF Employee Projects: *EmployeeID, *Project Title, Date, Hours ContributedOnThisDate
    private String employeeId; // Reference to Employee.id
    private String projectId;  // Reference to Project.id (equivalent to Project Title here)

    // Fields used for time tracking logic (from TimeClock.jsx)
    private Timestamp clockInTime;
    private Timestamp clockOutTime;
    private String status; // 'clocked-in' or 'clocked-out'

    public TimeEntry() {}

    public TimeEntry(String id, String employeeId, String projectId, Timestamp clockInTime, Timestamp clockOutTime, String status) {
        this.id = id;
        this.employeeId = employeeId;
        this.projectId = projectId;
        this.clockInTime = clockInTime;
        this.clockOutTime = clockOutTime;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public Timestamp getClockInTime() { return clockInTime; }
    public void setClockInTime(Timestamp clockInTime) { this.clockInTime = clockInTime; }

    public Timestamp getClockOutTime() { return clockOutTime; }
    public void setClockOutTime(Timestamp clockOutTime) { this.clockOutTime = clockOutTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    // --- Derived, JSON-serialized convenience fields ---
    public Long getClockInTimeMillis() {
        if (clockInTime == null) return null;
        return clockInTime.getSeconds() * 1000L + (clockInTime.getNanos() / 1_000_000L);
        // Alternative: clockInTime.toDate().getTime();
    }

    public Long getClockOutTimeMillis() {
        if (clockOutTime == null) return null;
        return clockOutTime.getSeconds() * 1000L + (clockOutTime.getNanos() / 1_000_000L);
    }

    public String getClockInTimeIso() {
        if (clockInTime == null) return null;
        Instant instant = Instant.ofEpochSecond(clockInTime.getSeconds(), clockInTime.getNanos());
        return DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC).format(instant);
    }

    public String getClockOutTimeIso() {
        if (clockOutTime == null) return null;
        Instant instant = Instant.ofEpochSecond(clockOutTime.getSeconds(), clockOutTime.getNanos());
        return DateTimeFormatter.ISO_INSTANT.withZone(ZoneOffset.UTC).format(instant);
    }

    public Long getDurationSeconds() {
        if (clockInTime == null || clockOutTime == null) return null;
        long inNs = clockInTime.getSeconds() * 1_000_000_000L + clockInTime.getNanos();
        long outNs = clockOutTime.getSeconds() * 1_000_000_000L + clockOutTime.getNanos();
        long diff = Math.max(0, outNs - inNs);
        return diff / 1_000_000_000L;
    }

    public Long getDurationMinutes() {
        Long seconds = getDurationSeconds();
        if (seconds == null) return null;
        return Math.round(seconds / 60.0);
    }

    public Double getDurationHours() {
        Long seconds = getDurationSeconds();
        if (seconds == null) return null;
        double hours = seconds / 3600.0;
        return Math.round(hours * 100.0) / 100.0; // two decimals
    }

    public String getDurationLabel() {
        Long seconds = getDurationSeconds();
        if (seconds == null) return null;
        long totalMinutes = Math.round(seconds / 60.0);
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        return hours + " hr " + minutes + " min";
    }
}