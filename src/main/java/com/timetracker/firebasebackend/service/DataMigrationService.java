package com.timetracker.firebasebackend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.DocumentReference;
import com.timetracker.firebasebackend.model.Employee;
import com.timetracker.firebasebackend.model.Project;
import com.timetracker.firebasebackend.model.LoginCredentials;
import com.timetracker.firebasebackend.model.ProjectEmployees;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class DataMigrationService {

    @Autowired
    private Firestore firestore;

    @Value("${firebase.collection.employees}")
    private String employeesCollection;

    @Value("${firebase.collection.projects}")
    private String projectsCollection;

    @Value("${firebase.collection.loginCredentials}")
    private String loginCredentialsCollection;

    @Value("${firebase.collection.projectEmployees}")
    private String projectEmployeesCollection;

    @Value("${firebase.collection.employeeProjects}")
    private String employeeProjectsCollection;

    @Value("${firebase.collection.projectReports}")
    private String projectReportsCollection;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public Map<String, Object> create6TableStructure() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create sample documents to initialize collections
            
            // 1. Initialize loginCredentials collection
            DocumentReference loginRef = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials").document("init");
            Map<String, Object> initLogin = new HashMap<>();
            initLogin.put("initialized", true);
            initLogin.put("description", "LoginCredentials collection for username/password storage");
            loginRef.set(initLogin).get();

            // 2. Initialize projectEmployees collection  
            DocumentReference projEmpRef = firestore.collection(projectEmployeesCollection != null ? projectEmployeesCollection : "projectEmployees").document("init");
            Map<String, Object> initProjEmp = new HashMap<>();
            initProjEmp.put("initialized", true);
            initProjEmp.put("description", "ProjectEmployees collection for project-employee assignments");
            projEmpRef.set(initProjEmp).get();

            // 3. Initialize employeeProjects collection
            DocumentReference empProjRef = firestore.collection(employeeProjectsCollection != null ? employeeProjectsCollection : "employeeProjects").document("init");
            Map<String, Object> initEmpProj = new HashMap<>();
            initEmpProj.put("initialized", true);
            initEmpProj.put("description", "EmployeeProjects collection for daily time entries");
            empProjRef.set(initEmpProj).get();

            // 4. Initialize projectReports collection
            DocumentReference reportsRef = firestore.collection(projectReportsCollection != null ? projectReportsCollection : "projectReports").document("init");
            Map<String, Object> initReports = new HashMap<>();
            initReports.put("initialized", true);
            initReports.put("description", "ProjectReports collection for progress reports");
            reportsRef.set(initReports).get();

            result.put("status", "success");
            result.put("message", "6-table structure created successfully");
            result.put("collections", List.of(
                employeesCollection,
                projectsCollection, 
                loginCredentialsCollection,
                projectEmployeesCollection,
                employeeProjectsCollection,
                projectReportsCollection
            ));

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Failed to create structure: " + e.getMessage());
        }

        return result;
    }

    public Map<String, Object> migratePasswordsToLoginCredentials() {
        Map<String, Object> result = new HashMap<>();
        int migratedCount = 0;
        int errorCount = 0;

        try {
            // Get all employees
            QuerySnapshot employeeSnapshot = firestore.collection(employeesCollection != null ? employeesCollection : "employees").get().get();
            
            for (QueryDocumentSnapshot empDoc : employeeSnapshot.getDocuments()) {
                try {
                    Employee employee = empDoc.toObject(Employee.class);
                    employee.setId(empDoc.getId());

                    // Skip if no password or already migrated
                    if (employee.getPassword() == null || employee.getPassword().isEmpty()) {
                        continue;
                    }

                    // Create login credentials
                    LoginCredentials credentials = new LoginCredentials();
                    credentials.setUsername(employee.getEmail() != null ? employee.getEmail().toLowerCase() : employee.getEmployeeId());
                    credentials.setPassword(employee.getPassword()); // Already hashed
                    credentials.setUserType("employee");
                    credentials.setEmployeeId(employee.getEmployeeId());

                    // Save to loginCredentials collection
                    DocumentReference credRef = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials").document();
                    credentials.setId(credRef.getId());
                    credRef.set(credentials).get();

                    migratedCount++;

                } catch (Exception e) {
                    errorCount++;
                    System.err.println("Error migrating employee " + empDoc.getId() + ": " + e.getMessage());
                }
            }

            // Create manager login credentials
            try {
                LoginCredentials managerCreds = new LoginCredentials();
                managerCreds.setUsername("manager");
                managerCreds.setPassword(passwordEncoder.encode("Adminmanager123@"));
                managerCreds.setUserType("manager");
                managerCreds.setEmployeeId("MANAGER001");

                DocumentReference managerRef = firestore.collection(loginCredentialsCollection != null ? loginCredentialsCollection : "loginCredentials").document("manager");
                managerCreds.setId("manager");
                managerRef.set(managerCreds).get();

            } catch (Exception e) {
                System.err.println("Manager credentials creation failed: " + e.getMessage());
            }

            result.put("status", "success");
            result.put("migratedEmployees", migratedCount);
            result.put("errors", errorCount);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
        }

        return result;
    }

    public Map<String, Object> migrateProjectAssignments() {
        Map<String, Object> result = new HashMap<>();
        int assignmentCount = 0;
        int errorCount = 0;

        try {
            // Get all projects
            QuerySnapshot projectSnapshot = firestore.collection(projectsCollection != null ? projectsCollection : "projects").get().get();
            
            for (QueryDocumentSnapshot projDoc : projectSnapshot.getDocuments()) {
                try {
                    Project project = projDoc.toObject(Project.class);
                    project.setId(projDoc.getId());

                    if (project.getAssignedEmployees() != null) {
                        for (String employeeId : project.getAssignedEmployees()) {
                            // Create ProjectEmployees entry
                            ProjectEmployees assignment = new ProjectEmployees();
                            assignment.setProjectTitle(project.getProjectTitle());
                            assignment.setEmployeeId(employeeId); // This is document ID
                            assignment.setHoursContributed(0.0);
                            assignment.setStatus("active");

                            DocumentReference assignRef = firestore.collection(projectEmployeesCollection != null ? projectEmployeesCollection : "projectEmployees").document();
                            assignment.setId(assignRef.getId());
                            assignRef.set(assignment).get();

                            assignmentCount++;
                        }
                    }

                } catch (Exception e) {
                    errorCount++;
                    System.err.println("Error migrating project " + projDoc.getId() + ": " + e.getMessage());
                }
            }

            result.put("status", "success");
            result.put("assignmentsMigrated", assignmentCount);
            result.put("errors", errorCount);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
        }

        return result;
    }

    public Map<String, Object> removePasswordsFromEmployees() {
        Map<String, Object> result = new HashMap<>();
        int cleanedCount = 0;
        int errorCount = 0;

        try {
            // Get all employees
            QuerySnapshot employeeSnapshot = firestore.collection(employeesCollection != null ? employeesCollection : "employees").get().get();
            
            for (QueryDocumentSnapshot empDoc : employeeSnapshot.getDocuments()) {
                try {
                    Employee employee = empDoc.toObject(Employee.class);
                    
                    // Remove password field
                    employee.setPassword(null);
                    
                    // Update document
                    empDoc.getReference().set(employee).get();
                    cleanedCount++;

                } catch (Exception e) {
                    errorCount++;
                    System.err.println("Error cleaning employee " + empDoc.getId() + ": " + e.getMessage());
                }
            }

            result.put("status", "success");
            result.put("cleanedEmployees", cleanedCount);
            result.put("errors", errorCount);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
        }

        return result;
    }

    public Map<String, Object> performFullMigration() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Step 1: Create 6-table structure
            Map<String, Object> structureResult = create6TableStructure();
            
            // Step 2: Migrate passwords
            Map<String, Object> passwordResult = migratePasswordsToLoginCredentials();
            
            // Step 3: Migrate assignments
            Map<String, Object> assignmentResult = migrateProjectAssignments();
            
            // Step 4: Clean up employees
            Map<String, Object> cleanupResult = removePasswordsFromEmployees();
            
            result.put("status", "success");
            result.put("message", "Full migration completed");
            result.put("structureCreation", structureResult);
            result.put("passwordMigration", passwordResult);
            result.put("assignmentMigration", assignmentResult);
            result.put("employeeCleanup", cleanupResult);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Full migration failed: " + e.getMessage());
        }

        return result;
    }

    public Map<String, Object> getDatabaseStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            // Count documents in each collection
            Map<String, Integer> collectionCounts = new HashMap<>();
            
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
                    collectionCounts.put(collection, snapshot.size());
                } catch (Exception e) {
                    collectionCounts.put(collection, 0);
                }
            }

            status.put("collectionCounts", collectionCounts);
            status.put("totalCollections", collections.length);
            status.put("message", "Database status retrieved successfully");

        } catch (Exception e) {
            status.put("error", e.getMessage());
        }

        return status;
    }
}