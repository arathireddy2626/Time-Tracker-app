package com.timetracker.firebasebackend.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.WriteResult;
import java.util.Map;
import com.timetracker.firebasebackend.model.TimeEntry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.logging.Logger;

@Service
public class TimeClockService {

    private static final Logger logger = Logger.getLogger(TimeClockService.class.getName());
    
    private final Firestore firestore;
    private final ProjectService projectService;
    
    @org.springframework.beans.factory.annotation.Value("${firebase.collection.timeEntries}")
    private String timeEntriesCollection;

    @Autowired
    public TimeClockService(Firestore firestore, ProjectService projectService) {
        this.firestore = firestore;
        this.projectService = projectService;
    }

    /**
     * Checks if an employee has an active 'clocked-in' entry.
     * Used by TimeClock.jsx on initial load.
     */
    public TimeEntry getActiveEntry(String employeeId) {
        try {
            // Firestore Query: where employeeId == X AND status == 'clocked-in'
        Query query = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries")
                    .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("status", "clocked-in")
                    .limit(1);

            List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

            if (documents.isEmpty()) {
                return null;
            }
            TimeEntry entry = documents.get(0).toObject(TimeEntry.class);
            entry.setId(documents.get(0).getId());
            return entry;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to check active clock-in status.", e);
        }
    }

    /**
     * Creates a new time entry with a clock-in time.
     * Used by TimeClock.jsx for handleClockIn.
     * 
     * SECURITY: Validates that the employee is assigned to the project before allowing clock-in.
     */
    public TimeEntry clockIn(String employeeId, String projectId) {
        try {
            // SECURITY VALIDATION: Check if employee is assigned to this project
            // Use the existing method that gets projects for employee
            List<com.timetracker.firebasebackend.model.Project> assignedProjects = projectService.getProjectsForEmployee(employeeId);
            boolean isAssigned = assignedProjects.stream()
                    .anyMatch(project -> projectId.equals(project.getId()));
            
            if (!isAssigned) {
                logger.warning("SECURITY ALERT: Employee " + employeeId + " attempted to clock in to unassigned project " + projectId);
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Employee is not assigned to this project and cannot clock in.");
            }

            logger.info("Employee " + employeeId + " successfully clocked in to project " + projectId);

            // Check if employee is already clocked in to another project
            TimeEntry existingActiveEntry = getActiveEntry(employeeId);
            if (existingActiveEntry != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, 
                    "Employee is already clocked in to another project. Please clock out first.");
            }

            TimeEntry newEntry = new TimeEntry();
            newEntry.setEmployeeId(employeeId);
            newEntry.setProjectId(projectId);
            newEntry.setClockInTime(Timestamp.now());
            newEntry.setStatus("clocked-in");

            ApiFuture<DocumentReference> future = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries").add(newEntry);
            newEntry.setId(future.get().getId());
            return newEntry;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to clock in.", e);
        }
    }

    /**
     * Updates an existing time entry with a clock-out time and status.
     * Also updates projectEmployees and projectAssignments collections.
     * Used by TimeClock.jsx for handleClockOut.
     */
    public void clockOut(String activeEntryId) {
        try {
            DocumentReference docRef = firestore.collection(timeEntriesCollection != null ? timeEntriesCollection : "timeEntries").document(activeEntryId != null ? activeEntryId : "");
            
            // Verify the entry exists and is in clocked-in status
            var snapshot = docRef.get().get();
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Time entry not found.");
            }
            
            TimeEntry entry = snapshot.toObject(TimeEntry.class);
            if (entry != null && !"clocked-in".equals(entry.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Cannot clock out - entry is not in clocked-in status.");
            }
            
            if (entry == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Time entry data not found.");
            }
            
            Timestamp clockOutTime = Timestamp.now();
            Timestamp clockInTime = entry.getClockInTime();
            
            // Calculate hours worked
            double hoursWorked = 0.0;
            if (clockInTime != null && clockOutTime != null) {
                long diffSeconds = clockOutTime.getSeconds() - clockInTime.getSeconds();
                hoursWorked = diffSeconds / 3600.0;
            }
            
            // Update the time entry: set clockOutTime and change status
            Map<String, Object> updateMap = new java.util.HashMap<>();
            updateMap.put("clockOutTime", clockOutTime);
            updateMap.put("status", "clocked-out");
            ApiFuture<WriteResult> future = docRef.update(updateMap);
            future.get();
            
            // Update projectEmployees collection (create daily work log entry)
            String employeeId = entry.getEmployeeId();
            String projectId = entry.getProjectId();
            
            try {
                // Get project title for description
                com.timetracker.firebasebackend.model.Project project = projectService.getProjectById(projectId);
                String projectTitle = project != null ? project.getProjectTitle() : "Unknown Project";
                
                Map<String, Object> projectEmployeeEntry = new java.util.HashMap<>();
                projectEmployeeEntry.put("employeeId", employeeId);
                projectEmployeeEntry.put("projectTitle", projectTitle);
                projectEmployeeEntry.put("date", clockOutTime);
                projectEmployeeEntry.put("hoursContributedOnThisDate", hoursWorked);
                projectEmployeeEntry.put("description", "Clocked out at " + (clockOutTime != null ? clockOutTime.toString() : "unknown time"));
                projectEmployeeEntry.put("status", "clocked-out");
                projectEmployeeEntry.put("id", firestore.collection("employeeProjects").document().getId());
                
                firestore.collection("employeeProjects").add(projectEmployeeEntry).get();
                logger.info("Created employeeProjects entry for employee " + employeeId + " with " + hoursWorked + " hours");
            } catch (Exception e) {
                logger.warning("Failed to create employeeProjects entry: " + e.getMessage());
            }
            
            // Update projectAssignments collection (update total hours contributed)
            try {
                // Find existing assignment
                var assignmentQuery = firestore.collection("projectAssignments")
                    .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("projectId", projectId)
                    .limit(1)
                    .get().get();
                
                if (!assignmentQuery.isEmpty()) {
                    // Update existing assignment
                    DocumentReference assignmentRef = assignmentQuery.getDocuments().get(0).getReference();
                    Double currentHours = assignmentQuery.getDocuments().get(0).getDouble("hoursContributed");
                    if (currentHours == null) currentHours = 0.0;
                    
                    Map<String, Object> assignmentUpdate = new java.util.HashMap<>();
                    assignmentUpdate.put("hoursContributed", currentHours + hoursWorked);
                    assignmentUpdate.put("lastUpdated", clockOutTime);
                    assignmentRef.update(assignmentUpdate).get();
                    
                    logger.info("Updated projectAssignments for employee " + employeeId + ": " + (currentHours + hoursWorked) + " total hours");
                } else {
                    // Create new assignment if doesn't exist
                    Map<String, Object> newAssignment = new java.util.HashMap<>();
                    newAssignment.put("employeeId", employeeId);
                    newAssignment.put("projectId", projectId);
                    newAssignment.put("hoursContributed", hoursWorked);
                    newAssignment.put("assignedDate", clockOutTime);
                    newAssignment.put("lastUpdated", clockOutTime);
                    newAssignment.put("status", "active");
                    newAssignment.put("id", firestore.collection("projectAssignments").document().getId());
                    
                    firestore.collection("projectAssignments").add(newAssignment).get();
                    logger.info("Created new projectAssignments entry for employee " + employeeId);
                }
            } catch (Exception e) {
                logger.warning("Failed to update projectAssignments: " + e.getMessage());
            }
            
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to clock out.", e);
        }
    }

    /**
     * Validates if an employee is assigned to a specific project.
     * Used for security checks and validation.
     */
    public boolean isEmployeeAssignedToProject(String employeeId, String projectId) {
        try {
            List<com.timetracker.firebasebackend.model.Project> assignedProjects = projectService.getProjectsForEmployee(employeeId);
            return assignedProjects.stream()
                    .anyMatch(project -> projectId.equals(project.getId()));
        } catch (Exception e) {
            // Log the error and return false for security
            System.err.println("Error checking project assignment: " + e.getMessage());
            return false;
        }
    }
}