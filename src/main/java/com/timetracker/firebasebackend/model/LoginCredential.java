package com.timetracker.firebasebackend.model;

public class LoginCredential {

    private String id; // Firestore Document ID

    // Fields based on PDF: *Username, *Password, Usertype
    private String username; // *Username (Primary Key/Unique Identifier)
    private String password; // *Password
    private String userType; // e.g., 'employee', 'manager'

    // Link back to the employee document
    private String employeeRef;
    private Boolean requiresPasswordChange;

    public LoginCredential() {}

    public LoginCredential(String id, String username, String password, String userType, String employeeRef, Boolean requiresPasswordChange) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.userType = userType;
        this.employeeRef = employeeRef;
        this.requiresPasswordChange = requiresPasswordChange;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public String getEmployeeRef() { return employeeRef; }
    public void setEmployeeRef(String employeeRef) { this.employeeRef = employeeRef; }

    public Boolean getRequiresPasswordChange() { return requiresPasswordChange; }
    public void setRequiresPasswordChange(Boolean requiresPasswordChange) { this.requiresPasswordChange = requiresPasswordChange; }
}