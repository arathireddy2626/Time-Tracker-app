package com.timetracker.firebasebackend.model;

import java.util.Date;

public class Employee {

    private String id; // Firestore Document ID

    // Fields based on PDF: *EmployeeID, Name, Year Of Joining, status
    private String employeeId; // *EmployeeID (Primary Key/Unique Identifier)
    private String firstName;  // Part of Name
    private String lastName;   // Part of Name
    private String yearOfJoining;
    private String status;     // e.g., 'active', 'inactive', 'invited'

    // Fields required by the frontend code (App.jsx, EmployeeManagement.jsx)
    private String email;
    private String username;
    private Boolean requiresPasswordChange;

    // Security and audit fields expected by services/controllers
    private String password;
    private Date createdAt;

    public Employee() {}

    public Employee(String id, String employeeId, String firstName, String lastName, String yearOfJoining,
                    String status, String email, String username, Boolean requiresPasswordChange,
                    String password, Date createdAt) {
        this.id = id;
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.yearOfJoining = yearOfJoining;
        this.status = status;
        this.email = email;
        this.username = username;
        this.requiresPasswordChange = requiresPasswordChange;
        this.password = password;
        this.createdAt = createdAt;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getYearOfJoining() { return yearOfJoining; }
    public void setYearOfJoining(String yearOfJoining) { this.yearOfJoining = yearOfJoining; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Boolean getRequiresPasswordChange() { return requiresPasswordChange; }
    public void setRequiresPasswordChange(Boolean requiresPasswordChange) { this.requiresPasswordChange = requiresPasswordChange; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}