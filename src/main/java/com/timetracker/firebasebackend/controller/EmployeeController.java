package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.dto.PasswordResetResponse;
import com.timetracker.firebasebackend.service.EmployeeService;
import com.timetracker.firebasebackend.model.Employee;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController

@RequestMapping("/api/v1/employees")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
}) 
public class EmployeeController {

    private final EmployeeService employeeService;
    
    @Autowired
    private com.timetracker.firebasebackend.service.LoginCredentialsService loginCredentialsService;

    // --- Inner Classes for Request Body Mapping (DTOs) ---

    public static class LoginRequest {
        public String username;
        public String password;
    }
    
    public static class SignUpRequest {
        public String fullName;
        public String employeeId;
        public String email;
        public String password;
    }

    // Dev DTO for pending signup seed
    public static class PendingSeedRequest {
        public String employeeId;
        public String email;
        public String fullName;
    }

    // Flexible DTO for invite payloads (supports first/last or fullName)
    public static class InviteRequest {
        public String firstName;
        public String lastName;
        public String fullName;
        public String employeeId;
        public String email;
        public String yearOfJoining;
    }

    public static class PasswordChangeRequest {
        public String currentPassword;
        public String newPassword;
    }

    public static class PasswordResetRequest {
        public String employeeId;
        public String email;
        public String fullName;
    }
    // --------------------------------------------------

    @Autowired
    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // Endpoint 1: GET all employees (Manager View)
    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    // Endpoint 2: POST Employee Login (used by App.jsx)
    @PostMapping("/login")
    public ResponseEntity<Employee> loginEmployee(@RequestBody LoginRequest loginRequest) {
        try {
            // Quick compatibility path for manager demo accounts
            if ("manager".equalsIgnoreCase(loginRequest.username)) {
                String pw = loginRequest.password == null ? "" : loginRequest.password;
                if ("admin123".equals(pw) || "Adminmanager123@".equals(pw)) {
                    // Historical contract: return 200 with null body for manager
                    return ResponseEntity.ok(null);
                }
            }

            // 1) Primary path: use dedicated login credentials collection (more reliable)
            try {
                Employee authed = loginCredentialsService.authenticateAndGetEmployee(
                        loginRequest.username, loginRequest.password);

                // Historical frontend behavior: return null for manager to route to manager dashboard
                if (authed != null && "MANAGER001".equals(authed.getEmployeeId())) {
                    return ResponseEntity.ok(null);
                }
                return ResponseEntity.ok(authed);
            } catch (org.springframework.web.server.ResponseStatusException ignored) {
                // fall through to legacy path
            }

            // 2) Legacy fallback: check password stored on employee document
            Employee employee = employeeService.findEmployeeByUsernameAndPassword(
                    loginRequest.username, loginRequest.password);
            if (employee == null && loginRequest.username != null && loginRequest.username.contains("@")) {
                // Try email-based fallback if user typed their email as username
                employee = employeeService.findEmployeeByEmailAndPassword(
                        loginRequest.username, loginRequest.password);
            }
            if (employee == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            if ("MANAGER001".equals(employee.getEmployeeId())) {
                return ResponseEntity.ok(null);
            }
            return ResponseEntity.ok(employee);
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).build();
        }
    }

    // Endpoint 3: POST Sign Up / Complete Registration (used by SignUpPage.jsx)
    @PostMapping("/signup")
    public ResponseEntity<Employee> signUpEmployee(@RequestBody SignUpRequest request) {
        try {
            Employee employee = employeeService.completeSignUp(
                request.employeeId, 
                request.email, 
                request.fullName, 
                request.password
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(employee);
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Dev helper: seed a pending (no-password) employee so signup can be tested
    @PostMapping("/dev-seed-pending")
    public ResponseEntity<Employee> devSeedPending(
            @RequestBody PendingSeedRequest request,
            @RequestHeader(value = "X-Dev-Auth", required = false) String devAuth) {
        if (devAuth == null || !"true".equalsIgnoreCase(devAuth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        try {
            Employee e = employeeService.createPendingSignupRecord(
                    request.employeeId,
                    request.email,
                    request.fullName
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(e);
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Endpoint 4: POST Invite Employee (used by AddNewEmployee.jsx)
    @PostMapping("/invite")
    public ResponseEntity<Employee> inviteEmployee(@RequestBody InviteRequest request) {
        try {
            System.out.println("\n========== FRONTEND → BACKEND: HTTP REQUEST RECEIVED ==========");
            System.out.println("→ Endpoint: POST /api/v1/employees/invite");
            System.out.println("→ Raw Request: employeeId=" + request.employeeId + ", email=" + request.email + ", firstName=" + request.firstName + ", lastName=" + request.lastName + ", fullName=" + request.fullName);
            System.out.println("========== CALLING SERVICE LAYER ==========\n");
            
            // Normalize names: prefer explicit first/last, else split fullName
            String firstName = request.firstName;
            String lastName = request.lastName;
            if ((firstName == null || firstName.isBlank()) && (lastName == null || lastName.isBlank()) && request.fullName != null && !request.fullName.isBlank()) {
                String[] parts = request.fullName.trim().split("\\s+", 2);
                firstName = parts[0];
                lastName = parts.length > 1 ? parts[1] : parts[0];
            }
            
            Employee toCreate = new Employee();
            toCreate.setFirstName(firstName);
            toCreate.setLastName(lastName);
            toCreate.setEmployeeId(request.employeeId);
            toCreate.setEmail(request.email != null ? request.email.toLowerCase() : null);
            toCreate.setYearOfJoining(request.yearOfJoining);
            
            Employee invitedEmployee = employeeService.addEmployee(toCreate);
            
            // Create login credentials for the employee
            try {
                String tempPassword = invitedEmployee.getPassword(); // Get the temp password from response
                loginCredentialsService.createLoginCredentials(
                    invitedEmployee.getUsername(), 
                    tempPassword, 
                    invitedEmployee.getEmployeeId(), 
                    "employee"
                );
                System.out.println("✓ Login credentials created for username: " + invitedEmployee.getUsername());
            } catch (Exception e) {
                System.out.println("⚠ Failed to create login credentials: " + e.getMessage());
                // Don't fail the entire operation, but log the error
            }
            
            System.out.println("\n========== BACKEND → FRONTEND: SENDING RESPONSE ==========");
            System.out.println("→ Status: 201 CREATED");
            System.out.println("→ Response includes: Document ID, Employee Data, Temp Password");
            System.out.println("========== RESPONSE SENT ==========\n");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(invitedEmployee);
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(null);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Endpoint 5: PUT Deactivate Employee (used by ViewEmployeeDetail.jsx)
    // Can accept either document ID or employeeId
    @PutMapping("/{employeeId}/deactivate")
    public ResponseEntity<Void> deactivateEmployee(@PathVariable String employeeId) {
        try {
            employeeService.deactivateEmployee(employeeId);
            return ResponseEntity.ok().build();
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Endpoint 6: PUT Change Password (used by ChangePassword.jsx)
    @PutMapping("/{employeeId}/password")
    public ResponseEntity<Void> changePassword(@PathVariable String employeeId, @RequestBody PasswordChangeRequest request) {
        employeeService.changePassword(employeeId, request.currentPassword, request.newPassword);
        return ResponseEntity.noContent().build();
    }
    
    // Endpoint 7: POST Forgot Password Reset (used by ForgotPasswordPage.jsx)
    @PostMapping("/forgot-password-reset")
    public ResponseEntity<PasswordResetResponse> forgotPasswordReset(@RequestBody PasswordResetRequest request) {
        
        PasswordResetResponse response = employeeService.resetPassword(
            request.employeeId, 
            request.email, 
            request.fullName
        );
        
        return ResponseEntity.ok(response);
    }

    // Endpoint 8: GET current authenticated employee (uses Firebase ID token verified by filter)
    @GetMapping("/me")
    public ResponseEntity<Employee> getCurrentEmployee(@RequestHeader(value = "Authorization", required = false) String authorization, @RequestAttribute(value = "firebaseUid", required = false) String firebaseUid) {
        // If firebaseUid is not present, the filter either didn't run or token not provided/invalid
        if (firebaseUid == null || firebaseUid.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Employee employee = employeeService.getEmployeeByFirebaseUid(firebaseUid);
        if (employee == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(employee);
    }
}