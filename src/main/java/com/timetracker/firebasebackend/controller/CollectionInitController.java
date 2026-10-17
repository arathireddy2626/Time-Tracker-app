package com.timetracker.firebasebackend.controller;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.timetracker.firebasebackend.model.ProjectEmployees;
import com.timetracker.firebasebackend.model.EmployeeProjects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/collections")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
}) 
public class CollectionInitController {

    @Autowired
    private Firestore firestore;

    @Value("${firebase.collection.projectEmployees}")
    private String projectEmployeesCollection;

    @Value("${firebase.collection.employeeProjects}")
    private String employeeProjectsCollection;

    @Value("${firebase.collection.projectReports}")
    private String projectReportsCollection;

    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializeCollections() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. Initialize ProjectEmployees collection with sample data
            ProjectEmployees projectEmployee = new ProjectEmployees();
            projectEmployee.setProjectTitle("New project 1");
            projectEmployee.setEmployeeId("009"); // mc kenna's employeeId
            projectEmployee.setHoursContributed(0.0);
            projectEmployee.setStatus("active");
            projectEmployee.setAssignedDate(Timestamp.now());

            DocumentReference docRef1 = firestore.collection(projectEmployeesCollection != null ? projectEmployeesCollection : "projectEmployees").document();
            projectEmployee.setId(docRef1.getId());
            docRef1.set(projectEmployee).get();

            // Add another sample assignment
            ProjectEmployees projectEmployee2 = new ProjectEmployees();
            projectEmployee2.setProjectTitle("Kardia Financial");
            projectEmployee2.setEmployeeId("018"); // roshni's employeeId
            projectEmployee2.setHoursContributed(15.5);
            projectEmployee2.setStatus("active");
            projectEmployee2.setAssignedDate(Timestamp.now());

            DocumentReference docRef2 = firestore.collection(projectEmployeesCollection != null ? projectEmployeesCollection : "projectEmployees").document();
            projectEmployee2.setId(docRef2.getId());
            docRef2.set(projectEmployee2).get();

            // 2. Initialize EmployeeProjects collection with sample data
            EmployeeProjects employeeProject = new EmployeeProjects();
            employeeProject.setEmployeeId("009"); // mc kenna
            employeeProject.setProjectTitle("New project 1");
            employeeProject.setHoursContributedOnThisDate(8.0);
            employeeProject.setDate(Timestamp.now());
            employeeProject.setDescription("Initial work on project setup");
            employeeProject.setStatus("clocked-out");

            DocumentReference docRef3 = firestore.collection(employeeProjectsCollection != null ? employeeProjectsCollection : "employeeProjects").document();
            employeeProject.setId(docRef3.getId());
            docRef3.set(employeeProject).get();

            // Add another sample entry
            EmployeeProjects employeeProject2 = new EmployeeProjects();
            employeeProject2.setEmployeeId("018"); // roshni
            employeeProject2.setProjectTitle("Kardia Financial");
            employeeProject2.setHoursContributedOnThisDate(7.5);
            employeeProject2.setDate(Timestamp.now());
            employeeProject2.setDescription("Frontend development work");
            employeeProject2.setStatus("clocked-out");

            DocumentReference docRef4 = firestore.collection(employeeProjectsCollection != null ? employeeProjectsCollection : "employeeProjects").document();
            employeeProject2.setId(docRef4.getId());
            docRef4.set(employeeProject2).get();

            // 3. Initialize ProjectReports collection with sample data
            Map<String, Object> projectReport = new HashMap<>();
            projectReport.put("reportingDate", Timestamp.now());
            projectReport.put("projectTitle", "New project 1");
            projectReport.put("anticipatedHours", 350);
            projectReport.put("completedHours", 25.5);
            projectReport.put("percentageCompleted", 7.3);
            projectReport.put("status", "on-track");
            projectReport.put("generatedBy", "MANAGER001");

            DocumentReference docRef5 = firestore.collection(projectReportsCollection != null ? projectReportsCollection : "projectReports").document();
            docRef5.set(projectReport).get();

            result.put("status", "success");
            result.put("message", "Collections initialized successfully");
            result.put("createdCollections", new String[]{
                projectEmployeesCollection,
                employeeProjectsCollection,
                projectReportsCollection
            });
            result.put("documentsCreated", 5);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Failed to initialize collections: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getCollectionStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            // Check if collections exist by trying to get document count
            long projectEmployeesCount = firestore.collection(projectEmployeesCollection != null ? projectEmployeesCollection : "projectEmployees").get().get().size();
            long employeeProjectsCount = firestore.collection(employeeProjectsCollection != null ? employeeProjectsCollection : "employeeProjects").get().get().size();
            long projectReportsCount = firestore.collection(projectReportsCollection != null ? projectReportsCollection : "projectReports").get().get().size();

            status.put("projectEmployees", Map.of(
                "collection", projectEmployeesCollection,
                "documentCount", projectEmployeesCount
            ));
            status.put("employeeProjects", Map.of(
                "collection", employeeProjectsCollection,
                "documentCount", employeeProjectsCount
            ));
            status.put("projectReports", Map.of(
                "collection", projectReportsCollection,
                "documentCount", projectReportsCount
            ));
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            status.put("error", e.getMessage());
            return ResponseEntity.status(500).body(status);
        }
    }
}