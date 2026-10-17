package com.timetracker.firebasebackend.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.timetracker.firebasebackend.model.Project;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class ProjectService {

    private final Firestore firestore;
    public static final String PROJECTS_COLLECTION = "projects";
    @org.springframework.beans.factory.annotation.Value("${firebase.collection.projects}")
    private String projectsCollection;

    @Autowired
    public ProjectService(Firestore firestore) {
        this.firestore = firestore;
    }

    // --- READ Operations ---

    public List<Project> getAllProjects() {
        try {
            QuerySnapshot querySnapshot = firestore.collection(projectsCollection != null ? projectsCollection : "projects").get().get();
            List<Project> projects = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Project project = document.toObject(Project.class);
                project.setId(document.getId());
                projects.add(project);
            }
            return projects;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve projects.", e);
        }
    }

    public Project getProjectById(String projectId) {
        try {
            DocumentReference docRef = firestore.collection(projectsCollection != null ? projectsCollection : "projects").document(projectId != null ? projectId : "");
            var snapshot = docRef.get().get();
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found with id: " + projectId);
            }
            Project project = snapshot.toObject(Project.class);
            if (project != null) {
                project.setId(snapshot.getId());
            }
            return project;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve project.", e);
        }
    }

    // --- CREATE/UPDATE Operations ---

    public Project addProject(Project project) {
        try {
            // Prepare safe payload excluding null id and ensuring assignedEmployees is not null
            List<String> safeAssigned = project.getAssignedEmployees() == null ? List.of() : project.getAssignedEmployees();
            var payload = new java.util.HashMap<String, Object>();
            payload.put("projectTitle", project.getProjectTitle());
            payload.put("description", project.getDescription());
            payload.put("anticipatedHours", project.getAnticipatedHours());
            payload.put("assignedEmployees", safeAssigned);

            DocumentReference docRef = firestore.collection(projectsCollection != null ? projectsCollection : "projects").add(payload).get();
            String docId = docRef.getId();
            // Persist the generated document ID inside the document for convenience in console/debug
            docRef.update("id", docId).get();

            project.setId(docId);
            project.setAssignedEmployees(safeAssigned);
            return project;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to add project.", e);
        }
    }

    // Get all projects assigned to a specific employee
    // HYBRID APPROACH: Supports both document IDs and employeeIds for backward compatibility
    public List<Project> getProjectsForEmployee(String employeeIdentifier) {
        try {
            // First try with the given identifier (could be document ID or employeeId)
            QuerySnapshot querySnapshot = firestore.collection(projectsCollection != null ? projectsCollection : "projects")
                    .whereArrayContains("assignedEmployees", employeeIdentifier != null ? employeeIdentifier : "")
                    .get().get();
            List<Project> projects = new ArrayList<>();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Project project = document.toObject(Project.class);
                project.setId(document.getId());
                projects.add(project);
            }
            
            // If no projects found and identifier looks like employeeId (short format like "009"),
            // try to find the document ID for this employee and search again
            if (projects.isEmpty() && employeeIdentifier != null && employeeIdentifier.length() <= 10) {
                try {
                    // Find employee by employeeId to get document ID
                    QuerySnapshot empQuery = firestore.collection("employees")
                            .whereEqualTo("employeeId", employeeIdentifier)
                            .limit(1)
                            .get().get();
                    
                    if (!empQuery.isEmpty()) {
                        String documentId = empQuery.getDocuments().get(0).getId();
                        // Search again with document ID
                        QuerySnapshot docIdQuery = firestore.collection(projectsCollection != null ? projectsCollection : "projects")
                                .whereArrayContains("assignedEmployees", documentId)
                                .get().get();
                        
                        for (QueryDocumentSnapshot document : docIdQuery.getDocuments()) {
                            Project project = document.toObject(Project.class);
                            project.setId(document.getId());
                            projects.add(project);
                        }
                    }
                } catch (Exception fallbackException) {
                    // Ignore fallback errors, return original results
                }
            }
            
            return projects;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve assigned projects.", e);
        }
    }

    // Updates assigned employees list (used by AssignEmployeeModal.jsx)
    public void updateAssignedEmployees(String projectId, List<String> employeeIds) {
        try {
            DocumentReference docRef = firestore.collection(projectsCollection != null ? projectsCollection : "projects").document(projectId != null ? projectId : "");
            // Ensure project exists
            var snapshot = docRef.get().get();
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
            }
            List<String> safeList = employeeIds == null ? List.of() : employeeIds;
            ApiFuture<WriteResult> future = docRef.update("assignedEmployees", safeList);
            future.get(); // Wait for completion
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to update project assignments.", e);
        }
    }

    // Assign a single employee to a project (incremental add)
    public void assignEmployee(String projectId, String employeeId) {
        try {
            DocumentReference docRef = firestore.collection(projectsCollection != null ? projectsCollection : "projects").document(projectId != null ? projectId : "");
            var snapshot = docRef.get().get();
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
            }
            Project project = snapshot.toObject(Project.class);
            if (project != null) {
                List<String> assigned = project.getAssignedEmployees() == null ? new ArrayList<>() : new ArrayList<>(project.getAssignedEmployees());
                if (!assigned.contains(employeeId)) {
                    assigned.add(employeeId);
                    docRef.update("assignedEmployees", assigned).get();
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to assign employee.", e);
        }
    }

    // Unassign a single employee from a project (incremental remove)
    public void unassignEmployee(String projectId, String employeeId) {
        try {
            DocumentReference docRef = firestore.collection(projectsCollection != null ? projectsCollection : "projects").document(projectId != null ? projectId : "");
            var snapshot = docRef.get().get();
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found");
            }
            Project project = snapshot.toObject(Project.class);
            if (project != null) {
                List<String> assigned = project.getAssignedEmployees() == null ? new ArrayList<>() : new ArrayList<>(project.getAssignedEmployees());
                assigned.remove(employeeId);
                docRef.update("assignedEmployees", assigned).get();
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to unassign employee.", e);
        }
    }

    // --- DELETE Operations ---

    public void deleteProject(String projectId) {
        try {
            ApiFuture<WriteResult> future = firestore.collection(projectsCollection != null ? projectsCollection : "projects").document(projectId != null ? projectId : "").delete();
            future.get(); // Wait for confirmation
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete project.", e);
        }
    }

    // Utility: backfill missing 'id' field inside documents so console shows it
    public int backfillProjectIds() {
        try {
            var col = firestore.collection(projectsCollection != null ? projectsCollection : "projects");
            var snapshot = col.get().get();
            int updated = 0;
            for (var doc : snapshot.getDocuments()) {
                Object idField = doc.get("id");
                if (idField == null || (idField instanceof String s && s.isBlank())) {
                    col.document(doc.getId()).update("id", doc.getId()).get();
                    updated++;
                }
                // Also ensure assignedEmployees exists
                Object assigned = doc.get("assignedEmployees");
                if (assigned == null) {
                    col.document(doc.getId()).update("assignedEmployees", List.of()).get();
                }
            }
            return updated;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to backfill project ids.", e);
        }
    }

    // NEW: Get projects using the new ProjectEmployees collection
    public List<Project> getProjectsForEmployeeUsingNewStructure(String employeeId) {
        try {
            // Get project titles from ProjectEmployees collection
            com.google.cloud.firestore.QuerySnapshot projEmpSnapshot = firestore.collection("projectEmployees")
                    .whereEqualTo("employeeId", employeeId)
                    .whereEqualTo("status", "active")
                    .get().get();
            
            List<Project> assignedProjects = new ArrayList<>();
            
            for (com.google.cloud.firestore.QueryDocumentSnapshot doc : projEmpSnapshot.getDocuments()) {
                String projectTitle = doc.getString("projectTitle");
                
                // Find the project by title
                com.google.cloud.firestore.QuerySnapshot projectSnapshot = firestore.collection(projectsCollection != null ? projectsCollection : "projects")
                        .whereEqualTo("projectTitle", projectTitle)
                        .limit(1)
                        .get().get();
                
                if (!projectSnapshot.isEmpty()) {
                    com.google.cloud.firestore.QueryDocumentSnapshot projectDoc = projectSnapshot.getDocuments().get(0);
                    Project project = projectDoc.toObject(Project.class);
                    project.setId(projectDoc.getId());
                    assignedProjects.add(project);
                }
            }
            
            return assignedProjects;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve assigned projects from new structure.", e);
        }
    }
}