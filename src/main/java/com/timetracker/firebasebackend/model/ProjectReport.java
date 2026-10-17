package com.timetracker.firebasebackend.model;

import com.google.cloud.Timestamp;

public class ProjectReport {

    private String id; // Firestore Document ID

    // Fields based on PDF: *Reporting Date, *Project Title, AnticipatedHours, CompletedHours
    private Timestamp reportingDate; // *Reporting Date (Primary Key component)
    private String projectId; // Reference to Project.id (equivalent to *Project Title)
    private Integer anticipatedHours;
    private Double completedHours; // Total completed hours

    public ProjectReport() {}

    public ProjectReport(String id, Timestamp reportingDate, String projectId, Integer anticipatedHours, Double completedHours) {
        this.id = id;
        this.reportingDate = reportingDate;
        this.projectId = projectId;
        this.anticipatedHours = anticipatedHours;
        this.completedHours = completedHours;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Timestamp getReportingDate() { return reportingDate; }
    public void setReportingDate(Timestamp reportingDate) { this.reportingDate = reportingDate; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public Integer getAnticipatedHours() { return anticipatedHours; }
    public void setAnticipatedHours(Integer anticipatedHours) { this.anticipatedHours = anticipatedHours; }

    public Double getCompletedHours() { return completedHours; }
    public void setCompletedHours(Double completedHours) { this.completedHours = completedHours; }
}