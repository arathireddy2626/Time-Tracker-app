package com.timetracker.firebasebackend.dto;

import java.util.List;

public class EmployeeReportData {
    // For GET /reports/employees/{id}
    private List<ProjectContribution> projectBreakdown;

    public EmployeeReportData() {}

    public EmployeeReportData(List<ProjectContribution> projectBreakdown) { this.projectBreakdown = projectBreakdown; }

    public List<ProjectContribution> getProjectBreakdown() { return projectBreakdown; }
    public void setProjectBreakdown(List<ProjectContribution> projectBreakdown) { this.projectBreakdown = projectBreakdown; }
}