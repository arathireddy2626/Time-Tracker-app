package com.timetracker.firebasebackend.model;

import com.google.cloud.Timestamp;

public class ProjectEmployees {
    private String id;
    private String projectTitle;
    private String employeeId;
    private double hoursContributed;
    private Timestamp assignedDate;
    private Timestamp lastUpdated;
    private String status; // "active", "completed", "inactive"

    // Default constructor
    public ProjectEmployees() {
        this.assignedDate = Timestamp.now();
        this.lastUpdated = Timestamp.now();
        this.status = "active";
        this.hoursContributed = 0.0;
    }

    // Constructor
    public ProjectEmployees(String projectTitle, String employeeId) {
        this();
        this.projectTitle = projectTitle;
        this.employeeId = employeeId;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public double getHoursContributed() { return hoursContributed; }
    public void setHoursContributed(double hoursContributed) { 
        this.hoursContributed = hoursContributed;
        this.lastUpdated = Timestamp.now();
    }

    public Timestamp getAssignedDate() { return assignedDate; }
    public void setAssignedDate(Timestamp assignedDate) { this.assignedDate = assignedDate; }

    public Timestamp getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Timestamp lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getStatus() { return status; }
    public void setStatus(String status) { 
        this.status = status;
        this.lastUpdated = Timestamp.now();
    }

    // Helper method to add hours
    public void addHours(double hours) {
        this.hoursContributed += hours;
        this.lastUpdated = Timestamp.now();
    }
}