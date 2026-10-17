package com.timetracker.firebasebackend.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.timetracker.firebasebackend.model.ProjectAssignment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.ExecutionException;

@Service
public class ProjectAssignmentService {

    private final Firestore firestore;

    @Value("${firebase.collection.assignments:projectAssignments}")
    private String assignmentsCollection;

    public ProjectAssignmentService(Firestore firestore) {
        this.firestore = firestore;
    }

    public ProjectAssignment createAssignment(ProjectAssignment assignment) {
        try {
            if (assignment.getProjectId() == null || assignment.getProjectId().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId is required");
            }
            if (assignment.getEmployeeId() == null || assignment.getEmployeeId().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "employeeId is required");
            }

            // Optional: prevent duplicate assignment of same employee to same project
            CollectionReference col = firestore.collection(assignmentsCollection != null ? assignmentsCollection : "projectAssignments");
            QuerySnapshot existing = col.whereEqualTo("projectId", assignment.getProjectId())
                    .whereEqualTo("employeeId", assignment.getEmployeeId())
                    .limit(1)
                    .get().get();
            if (!existing.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment already exists");
            }

            if (assignment.getTotalHoursContributed() == null) {
                assignment.setTotalHoursContributed(0.0);
            }

            ApiFuture<DocumentReference> future = col.add(assignment);
            DocumentReference ref = future.get();
            assignment.setId(ref.getId());
            return assignment;
        } catch (InterruptedException | ExecutionException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create assignment", e);
        }
    }
}
