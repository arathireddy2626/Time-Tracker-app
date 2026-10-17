package com.timetracker.firebasebackend.model;

import com.google.cloud.Timestamp;

public class LoginCredentials {
    private String id;
    private String username;
    private String password;
    private String userType; // "manager" or "employee"
    private String employeeId; // Reference to Employee entity
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private boolean isActive;

    // Default constructor
    public LoginCredentials() {
        this.isActive = true;
        this.createdAt = Timestamp.now();
        this.updatedAt = Timestamp.now();
    }

    // Constructor
    public LoginCredentials(String username, String password, String userType, String employeeId) {
        this();
        this.username = username;
        this.password = password;
        this.userType = userType;
        this.employeeId = employeeId;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}