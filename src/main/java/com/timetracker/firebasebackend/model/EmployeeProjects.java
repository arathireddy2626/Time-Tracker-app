package com.timetracker.firebasebackend.model;

import com.google.cloud.Timestamp;

public class EmployeeProjects {
    private String id;
    private String employeeId;
    private String projectTitle;
    private Timestamp date;
    private double hoursContributedOnThisDate;
    private String description;
    private String status; // "clocked-in", "clocked-out", "break"

    // Default constructor
    public EmployeeProjects() {
        this.date = Timestamp.now();
        this.hoursContributedOnThisDate = 0.0;
        this.status = "clocked-out";
    }

    // Constructor
    public EmployeeProjects(String employeeId, String projectTitle, double hours) {
        this();
        this.employeeId = employeeId;
        this.projectTitle = projectTitle;
        this.hoursContributedOnThisDate = hours;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }

    public Timestamp getDate() { return date; }
    public void setDate(Timestamp date) { this.date = date; }

    public double getHoursContributedOnThisDate() { return hoursContributedOnThisDate; }
    public void setHoursContributedOnThisDate(double hoursContributedOnThisDate) { 
        this.hoursContributedOnThisDate = hoursContributedOnThisDate; 
    }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    // Helper method to add hours to this date
    public void addHoursToDate(double hours) {
        this.hoursContributedOnThisDate += hours;
    }
}