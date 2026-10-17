package com.timetracker.firebasebackend.model;

import java.util.List;

public class Project {

    private String id; // Firestore Document ID

    // Fields based on PDF: *Project Title, Description, Anticipated Hours
    private String projectTitle;      // *Project Title (Primary Key/Unique Identifier)
    private String description;
    private Integer anticipatedHours;

    // Field for the Many-to-Many relationship (used extensively in frontend)
    private List<String> assignedEmployees; // List of Employee.id strings

    public Project() {}

    public Project(String id, String projectTitle, String description, Integer anticipatedHours, List<String> assignedEmployees) {
        this.id = id;
        this.projectTitle = projectTitle;
        this.description = description;
        this.anticipatedHours = anticipatedHours;
        this.assignedEmployees = assignedEmployees;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getAnticipatedHours() { return anticipatedHours; }
    public void setAnticipatedHours(Integer anticipatedHours) { this.anticipatedHours = anticipatedHours; }

    public List<String> getAssignedEmployees() { return assignedEmployees; }
    public void setAssignedEmployees(List<String> assignedEmployees) { this.assignedEmployees = assignedEmployees; }
}