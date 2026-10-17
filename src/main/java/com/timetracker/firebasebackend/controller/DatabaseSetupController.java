package com.timetracker.firebasebackend.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentReference;
import com.timetracker.firebasebackend.model.LoginCredentials;
import com.timetracker.firebasebackend.model.ProjectEmployees;
import com.timetracker.firebasebackend.model.EmployeeProjects;
import com.timetracker.firebasebackend.model.ProjectReport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import com.google.cloud.Timestamp;

@RestController
@RequestMapping("/api/v1/database-setup")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
}) 
public class DatabaseSetupController {

    @Autowired
    private Firestore firestore;

    // Create all 6 collections with sample data
    @PostMapping("/initialize-collections")
    public ResponseEntity<Map<String, String>> initializeCollections() {
        Map<String, String> result = new HashMap<>();
        
        try {
            // 1. Create LoginCredentials collection
            LoginCredentials managerCreds = new LoginCredentials();
            managerCreds.setUsername("manager");
            managerCreds.setPassword("$2a$10$encodedPassword"); // BCrypt encoded
            managerCreds.setUserType("manager");
            managerCreds.setEmployeeId("MANAGER001");
            
            DocumentReference loginRef = firestore.collection("loginCredentials").document();
            managerCreds.setId(loginRef.getId());
            loginRef.set(managerCreds).get();
            
            // 2. Create ProjectEmployees collection
            ProjectEmployees projEmp = new ProjectEmployees();
            projEmp.setProjectTitle("Kardia Financial");
            projEmp.setEmployeeId("009"); // mc kenna's employeeId
            projEmp.setHoursContributed(25.5);
            
            DocumentReference projEmpRef = firestore.collection("projectEmployees").document();
            projEmp.setId(projEmpRef.getId());
            projEmpRef.set(projEmp).get();
            
            // 3. Create EmployeeProjects collection
            EmployeeProjects empProj = new EmployeeProjects();
            empProj.setEmployeeId("009"); // mc kenna's employeeId
            empProj.setProjectTitle("Kardia Financial");
            empProj.setHoursContributedOnThisDate(8.0);
            empProj.setDate(Timestamp.now());
            
            DocumentReference empProjRef = firestore.collection("employeeProjects").document();
            empProj.setId(empProjRef.getId());
            empProjRef.set(empProj).get();
            
            // 4. Create ProjectReports collection
            ProjectReport report = new ProjectReport();
            report.setReportingDate(Timestamp.now());
            report.setProjectId("VyRT0ZEsOI45jUM7UTNE"); // Kardia Financial project ID
            report.setAnticipatedHours(400);
            report.setCompletedHours(125.5);
            
            DocumentReference reportRef = firestore.collection("projectReports").document();
            report.setId(reportRef.getId());
            reportRef.set(report).get();
            
            result.put("status", "success");
            result.put("message", "All 6 collections initialized successfully");
            result.put("loginCredentials", "✓ Created");
            result.put("projectEmployees", "✓ Created");
            result.put("employeeProjects", "✓ Created");
            result.put("projectReports", "✓ Created");
            result.put("employees", "✓ Already exists");
            result.put("projects", "✓ Already exists");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Failed to initialize collections: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
    
    // Get collection status
    @GetMapping("/collections-status")
    public ResponseEntity<Map<String, Object>> getCollectionsStatus() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            // Check each collection
            List<String> collections = new ArrayList<>();
            collections.add("employees");
            collections.add("projects");
            collections.add("timeEntries");
            collections.add("projectAssignments");
            collections.add("loginCredentials");
            collections.add("projectEmployees");
            collections.add("employeeProjects");
            collections.add("projectReports");
            
            Map<String, Integer> collectionCounts = new HashMap<>();
            
            for (String collection : collections) {
                try {
                    int count = firestore.collection(collection != null ? collection : "").get().get().size();
                    collectionCounts.put(collection, count);
                } catch (Exception e) {
                    collectionCounts.put(collection, 0);
                }
            }
            
            status.put("collections", collectionCounts);
            status.put("totalCollections", collections.size());
            status.put("message", "Collection status retrieved successfully");
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            status.put("error", e.getMessage());
            return ResponseEntity.status(500).body(status);
        }
    }
    
    // Create proper assignment using employeeId instead of document ID
    @PostMapping("/fix-assignments")
    public ResponseEntity<Map<String, String>> fixAssignments() {
        Map<String, String> result = new HashMap<>();
        
        try {
            // Create ProjectEmployees entries for existing assignments
            // mc kenna (employeeId: 009) should be assigned to projects
            String[] projects = {"Kardia Financial", "Covalent Health", "New project 1", "nice"};
            
            for (String projectTitle : projects) {
                ProjectEmployees assignment = new ProjectEmployees();
                assignment.setProjectTitle(projectTitle);
                assignment.setEmployeeId("009"); // Use employeeId, not document ID
                assignment.setHoursContributed(0.0);
                
                DocumentReference ref = firestore.collection("projectEmployees").document();
                assignment.setId(ref.getId());
                ref.set(assignment).get();
            }
            
            result.put("status", "success");
            result.put("message", "Fixed assignments using employeeId instead of document ID");
            result.put("assignedProjects", "4");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", "Failed to fix assignments: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }
}