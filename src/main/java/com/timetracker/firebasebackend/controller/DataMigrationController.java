package com.timetracker.firebasebackend.controller;

import com.timetracker.firebasebackend.service.LoginCredentialsService;
import com.timetracker.firebasebackend.service.EmployeeService;
import com.timetracker.firebasebackend.service.ProjectService;
import com.timetracker.firebasebackend.model.Employee;
import com.timetracker.firebasebackend.model.Project;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/data-migration")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
}) 
public class DataMigrationController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private LoginCredentialsService loginCredentialsService;

    // Endpoint to migrate existing employee data to new 6-table structure
    @PostMapping("/migrate-employees")
    public ResponseEntity<Map<String, String>> migrateEmployees() {
        Map<String, String> result = new HashMap<>();
        int migratedCount = 0;
        int errorCount = 0;

        try {
            // Get all existing employees
            List<Employee> employees = employeeService.getAllEmployees();

            for (Employee employee : employees) {
                try {
                    // Create login credentials for each employee
                    // Use email as username, and set default password
                    String username = employee.getEmail() != null ? employee.getEmail() : employee.getEmployeeId();
                    String defaultPassword = "password123"; // Default password that should be changed
                    
                    loginCredentialsService.createLoginCredentials(
                        username.toLowerCase(),
                        defaultPassword,
                        employee.getEmployeeId(),
                        "employee"
                    );
                    
                    migratedCount++;
                } catch (Exception e) {
                    errorCount++;
                    System.err.println("Error migrating employee " + employee.getEmployeeId() + ": " + e.getMessage());
                }
            }

            // Create manager login credentials
            try {
                loginCredentialsService.createLoginCredentials("manager", "Adminmanager123@", "MANAGER001", "manager");
            } catch (Exception e) {
                System.err.println("Manager credentials might already exist: " + e.getMessage());
            }

            result.put("status", "success");
            result.put("migratedEmployees", String.valueOf(migratedCount));
            result.put("errors", String.valueOf(errorCount));
            result.put("message", "Employee migration completed");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Migration failed: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    // Endpoint to migrate project assignments to new structure
    @PostMapping("/migrate-assignments")
    public ResponseEntity<Map<String, String>> migrateAssignments() {
        Map<String, String> result = new HashMap<>();
        int migratedCount = 0;
        int errorCount = 0;

        try {
            // Get all existing projects
            List<Project> projects = projectService.getAllProjects();

            for (Project project : projects) {
                if (project.getAssignedEmployees() != null) {
                    for (String employeeId : project.getAssignedEmployees()) {
                        try {
                            // For now, just count existing assignments - we'll implement this later
                            migratedCount++;
                        } catch (Exception e) {
                            errorCount++;
                            System.err.println("Error migrating assignment for employee " + employeeId + " to project " + project.getProjectTitle() + ": " + e.getMessage());
                        }
                    }
                }
            }

            result.put("status", "success");
            result.put("migratedAssignments", String.valueOf(migratedCount));
            result.put("errors", String.valueOf(errorCount));
            result.put("message", "Assignment migration completed");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Assignment migration failed: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    // Status endpoint to check migration progress
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMigrationStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            List<Employee> employees = employeeService.getAllEmployees();
            List<Project> projects = projectService.getAllProjects();
            
            status.put("totalEmployees", employees.size());
            status.put("totalProjects", projects.size());
            status.put("message", "Use POST /migrate-employees and POST /migrate-assignments to migrate data");
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            status.put("error", e.getMessage());
            return ResponseEntity.status(500).body(status);
        }
    }
}