package com.timetracker.firebasebackend.model;

public class ProjectAssignment {

    private String id; // Firestore Document ID (e.g., a combination of projectId and employeeId)

    // Fields based on PDF Project Employees: *Project Title, *EmployeeID, Hours Contributed
    private String projectId;  // Reference to Project.id (*Project Title)
    private String employeeId; // Reference to Employee.id (*EmployeeID)
    private Double totalHoursContributed; // Aggregated value over the assignment period

    public ProjectAssignment() {}

    public ProjectAssignment(String id, String projectId, String employeeId, Double totalHoursContributed) {
        this.id = id;
        this.projectId = projectId;
        this.employeeId = employeeId;
        this.totalHoursContributed = totalHoursContributed;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public Double getTotalHoursContributed() { return totalHoursContributed; }
    public void setTotalHoursContributed(Double totalHoursContributed) { this.totalHoursContributed = totalHoursContributed; }
}