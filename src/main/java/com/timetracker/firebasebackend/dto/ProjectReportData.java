package com.timetracker.firebasebackend.dto;

import java.util.List;
import java.util.Map;

public class ProjectReportData {
    // For GET /reports/projects/{id}
    private double totalHours;
    // Key: Employee ID, Value: Total hours worked by that employee on the project
    private Map<String, Double> employeeHours;
    // Breakdown list expected by ReportService
    private List<ProjectContribution> employeeBreakdown;

    public ProjectReportData() {}

    public ProjectReportData(double totalHours, Map<String, Double> employeeHours, List<ProjectContribution> employeeBreakdown) {
        this.totalHours = totalHours;
        this.employeeHours = employeeHours;
        this.employeeBreakdown = employeeBreakdown;
    }

    public double getTotalHours() { return totalHours; }
    public void setTotalHours(double totalHours) { this.totalHours = totalHours; }

    public Map<String, Double> getEmployeeHours() { return employeeHours; }
    public void setEmployeeHours(Map<String, Double> employeeHours) { this.employeeHours = employeeHours; }

    public List<ProjectContribution> getEmployeeBreakdown() { return employeeBreakdown; }
    public void setEmployeeBreakdown(List<ProjectContribution> employeeBreakdown) { this.employeeBreakdown = employeeBreakdown; }
}