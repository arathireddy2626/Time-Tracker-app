package com.timetracker.firebasebackend.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.timetracker.firebasebackend.model.Employee;
import com.timetracker.firebasebackend.model.Project;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/quick-fix")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
}) 
public class QuickFixController {

    @Autowired
    private Firestore firestore;

    @Value("${firebase.collection.loginCredentials}")
    private String loginCredentialsCollection;

    @Value("${firebase.collection.projectEmployees}")
    private String projectEmployeesCollection;

    @Value("${firebase.collection.employeeProjects}")
    private String employeeProjectsCollection;

    @Value("${firebase.collection.projectReports}")
    private String projectReportsCollection;

    @Value("${firebase.collection.employees}")
    private String employeesCollection;

    @Value("${firebase.collection.projects}")
    private String projectsCollection;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/create-collections")
    public ResponseEntity<Map<String, Object>> createAllCollections() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. Create loginCredentials collection
            createLoginCredentials();
            
            // 2. Create projectEmployees collection  
            createProjectEmployeesAssignments();
            
            // 3. Initialize other collections
            initializeCollection(employeeProjectsCollection, "EmployeeProjects collection for daily time tracking");
            initializeCollection(projectReportsCollection, "ProjectReports collection for progress reports");
            
            // 4. Clean passwords from employees
            cleanPasswordsFromEmployees();

            result.put("status", "success");
            result.put("message", "All 6 collections created and configured properly");
            result.put("collections", List.of(
                employeesCollection + " (cleaned - no passwords)",
                projectsCollection,
                loginCredentialsCollection + " (created)",
                projectEmployeesCollection + " (created)", 
                employeeProjectsCollection + " (initialized)",
                projectReportsCollection + " (initialized)"
            ));

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Failed: " + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }

    private void createLoginCredentials() throws Exception {
        // Create manager login
        Map<String, Object> managerLogin = new HashMap<>();
        managerLogin.put("username", "manager");
        managerLogin.put("password", passwordEncoder.encode("Adminmanager123@"));
        managerLogin.put("userType", "manager");
        managerLogin.put("employeeId", "MANAGER001");
        managerLogin.put("isActive", true);
        
        firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials").document("manager").set(managerLogin).get();

        // Create login credentials for all employees
        QuerySnapshot employees = firestore.collection(employeesCollection != null ? employeesCollection : "employees").get().get();
        
        for (QueryDocumentSnapshot empDoc : employees.getDocuments()) {
            Employee emp = empDoc.toObject(Employee.class);
            
            if (emp.getPassword() != null && !emp.getPassword().isEmpty()) {
                Map<String, Object> empLogin = new HashMap<>();
                empLogin.put("username", emp.getEmail() != null ? emp.getEmail().toLowerCase() : emp.getEmployeeId());
                empLogin.put("password", emp.getPassword()); // Keep existing hash
                empLogin.put("userType", "employee");
                empLogin.put("employeeId", emp.getEmployeeId());
                empLogin.put("isActive", true);
                
                firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials").document(empDoc.getId()).set(empLogin).get();
            }
        }
    }

    private void createProjectEmployeesAssignments() throws Exception {
        // Migrate project assignments to projectEmployees collection
        QuerySnapshot projects = firestore.collection(projectsCollection != null ? projectsCollection : "projects").get().get();
        
        for (QueryDocumentSnapshot projDoc : projects.getDocuments()) {
            Project project = projDoc.toObject(Project.class);
            
            if (project.getAssignedEmployees() != null) {
                for (String employeeId : project.getAssignedEmployees()) {
                    Map<String, Object> assignment = new HashMap<>();
                    assignment.put("projectTitle", project.getProjectTitle());
                    assignment.put("employeeId", employeeId); // Document ID
                    assignment.put("hoursContributed", 0.0);
                    assignment.put("status", "active");
                    assignment.put("assignedDate", com.google.cloud.Timestamp.now());
                    
                    firestore.collection(projectEmployeesCollection != null ? projectEmployeesCollection : "projectEmployees").add(assignment).get();
                }
            }
        }
    }

    private void initializeCollection(String collectionName, String description) throws Exception {
        Map<String, Object> init = new HashMap<>();
        init.put("initialized", true);
        init.put("description", description);
        init.put("createdAt", com.google.cloud.Timestamp.now());
        
        firestore.collection(collectionName != null ? collectionName : "").document("_init").set(init).get();
    }

    private void cleanPasswordsFromEmployees() throws Exception {
        QuerySnapshot employees = firestore.collection(employeesCollection != null ? employeesCollection : "employees").get().get();
        
        for (QueryDocumentSnapshot empDoc : employees.getDocuments()) {
            Employee emp = empDoc.toObject(Employee.class);
            emp.setPassword(null); // Remove password
            empDoc.getReference().set(emp).get();
        }
    }

    @GetMapping("/check-collections")
    public ResponseEntity<Map<String, Object>> checkCollections() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Map<String, Integer> counts = new HashMap<>();
            
            String[] collections = {
                employeesCollection,
                projectsCollection,
                loginCredentialsCollection,
                projectEmployeesCollection,
                employeeProjectsCollection,
                projectReportsCollection
            };

            for (String collection : collections) {
                try {
                    QuerySnapshot snapshot = firestore.collection(collection != null ? collection : "").get().get();
                    counts.put(collection, snapshot.size());
                } catch (Exception e) {
                    counts.put(collection, 0);
                }
            }

            result.put("collectionCounts", counts);
            result.put("status", "success");

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
        }

        return ResponseEntity.ok(result);
    }
}