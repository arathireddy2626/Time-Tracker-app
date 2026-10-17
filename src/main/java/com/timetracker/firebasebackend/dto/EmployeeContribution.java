package com.timetracker.firebasebackend.dto;

public class EmployeeContribution {
    private String id; // Employee ID or Project ID
    private String name; // Full Name or Project Title
    private double hours;

    public EmployeeContribution() {}

    public EmployeeContribution(String id, String name, double hours) {
        this.id = id;
        this.name = name;
        this.hours = hours;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getHours() { return hours; }
    public void setHours(double hours) { this.hours = hours; }
}