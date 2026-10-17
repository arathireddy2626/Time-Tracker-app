package com.timetracker.firebasebackend.dto;

public class PasswordResetResponse {
    // For POST /employees/forgot-password-reset
    private String newPassword;

    public PasswordResetResponse() {}

    public PasswordResetResponse(String newPassword) { this.newPassword = newPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}